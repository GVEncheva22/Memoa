from __future__ import annotations

from dataclasses import asdict, dataclass
from pathlib import Path
from sqlite3 import Connection, IntegrityError, Row, connect

from flask import Flask, jsonify, request
from flask_cors import CORS
from werkzeug.security import check_password_hash, generate_password_hash

BASE_DIR = Path(__file__).resolve().parent
DB_PATH = BASE_DIR / "memoa.db"


def get_connection() -> Connection:
  conn = connect(DB_PATH)
  conn.row_factory = Row
  return conn


def init_db() -> None:
  DB_PATH.parent.mkdir(parents=True, exist_ok=True)
  with get_connection() as conn:
    conn.executescript(
        """
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          email TEXT NOT NULL UNIQUE,
          password TEXT NOT NULL,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS notes (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          content TEXT NOT NULL,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
        );
        """
    )


@dataclass
class User:
  id: int
  name: str
  email: str


def row_to_user(row: Row) -> User:
  return User(id=row["id"], name=row["name"], email=row["email"])


app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}})
init_db()


@app.get("/api/health")
def health():
  return jsonify({"status": "ok"})


@app.post("/api/register")
def register():
  data = request.get_json(force=True)
  name = data.get("name", "").strip()
  email = data.get("email", "").strip().lower()
  password = data.get("password", "")

  if not name or not email or not password:
    return jsonify({"message": "All fields are required."}), 400

  password_hash = generate_password_hash(password)

  with get_connection() as conn:
    try:
      cursor = conn.execute(
          "INSERT INTO users (name, email, password) VALUES (?, ?, ?)",
          (name, email, password_hash),
      )
      user_id = cursor.lastrowid
    except IntegrityError:
      return jsonify({"message": "Email already registered."}), 400

    user_row = conn.execute("SELECT id, name, email FROM users WHERE id = ?", (user_id,)).fetchone()

  user = row_to_user(user_row)
  return jsonify({"user": asdict(user)})


@app.post("/api/login")
def login():
  data = request.get_json(force=True)
  email = data.get("email", "").strip().lower()
  password = data.get("password", "")

  if not email or not password:
    return jsonify({"message": "Email and password are required."}), 400

  with get_connection() as conn:
    user_row = conn.execute("SELECT * FROM users WHERE email = ?", (email,)).fetchone()

  if not user_row or not check_password_hash(user_row["password"], password):
    return jsonify({"message": "Invalid credentials."}), 401

  user = row_to_user(user_row)
  return jsonify({"user": asdict(user)})


@app.get("/api/notes")
def get_notes():
  user_id = request.args.get("userId")
  if not user_id:
    return jsonify({"message": "Missing userId."}), 400

  with get_connection() as conn:
    rows = conn.execute(
        "SELECT id, content, created_at FROM notes WHERE user_id = ? ORDER BY created_at DESC",
        (user_id,),
    ).fetchall()

  notes = [
      {"id": row["id"], "content": row["content"], "createdAt": row["created_at"]}
      for row in rows
  ]
  return jsonify({"notes": notes})


@app.post("/api/notes")
def create_note():
  data = request.get_json(force=True)
  user_id = data.get("userId")
  content = (data.get("content") or "").strip()

  if not user_id or not content:
    return jsonify({"message": "userId and content are required."}), 400

  with get_connection() as conn:
    cursor = conn.execute(
        "INSERT INTO notes (user_id, content) VALUES (?, ?)",
        (user_id, content),
    )
    note_id = cursor.lastrowid
    row = conn.execute(
        "SELECT id, content, created_at FROM notes WHERE id = ?", (note_id,)
    ).fetchone()

  note = {"id": row["id"], "content": row["content"], "createdAt": row["created_at"]}
  return jsonify({"note": note}), 201


@app.delete("/api/notes/<int:note_id>")
def delete_note(note_id: int):
  with get_connection() as conn:
    cursor = conn.execute("DELETE FROM notes WHERE id = ?", (note_id,))
    if cursor.rowcount == 0:
      return jsonify({"message": "Note not found."}), 404

  return jsonify({"status": "deleted"})


@app.post("/api/account/deactivate")
def deactivate_account():
  try:
    data = request.get_json(force=True)
    user_id = data.get("userId")
    password = data.get("password", "")

    print(f"Deactivate request - userId: {user_id}, password provided: {bool(password)}")

    if not user_id or not password:
      return jsonify({"message": "userId and password are required."}), 400

    # Ensure user_id is an integer
    try:
      user_id = int(user_id)
    except (ValueError, TypeError):
      return jsonify({"message": "Invalid user ID format."}), 400

    with get_connection() as conn:
      user_row = conn.execute("SELECT id, password FROM users WHERE id = ?", (user_id,)).fetchone()

    print(f"User found: {user_row is not None}")

    if not user_row:
      return jsonify({"message": "User not found."}), 404

    if not check_password_hash(user_row["password"], password):
      print(f"Password check failed for user {user_id}")
      return jsonify({"message": "Invalid password."}), 401

    with get_connection() as conn:
      # Delete all notes associated with the user
      conn.execute("DELETE FROM notes WHERE user_id = ?", (user_id,))
      # Delete the user account
      conn.execute("DELETE FROM users WHERE id = ?", (user_id,))
      conn.commit()

    print(f"Account {user_id} successfully deactivated")
    return jsonify({"status": "deactivated", "message": "Account successfully deactivated."}), 200
  except Exception as e:
    print(f"Deactivation error: {str(e)}")
    return jsonify({"message": f"Server error: {str(e)}"}), 500


if __name__ == "__main__":
  app.run(host="0.0.0.0", port=5000, debug=True)
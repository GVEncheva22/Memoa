/**
 * Account Modal Handler
 * Manages the account deactivation modal dialog
 */

const initAccountModal = () => {
  const sidebarAccountBtn = document.getElementById('sidebarAccount');
  const accountModal = document.getElementById('accountModal');
  const accountModalOverlay = document.getElementById('accountModalOverlay');
  const cancelDeactivateBtn = document.getElementById('cancelDeactivateBtn');
  const deactivateBtn = document.getElementById('deactivateBtn');

  if (!sidebarAccountBtn || !accountModal) return;

  // Open modal when account button is clicked
  sidebarAccountBtn.addEventListener('click', () => {
    accountModal.classList.add('active');
  });

  // Close modal when cancel button is clicked
  if (cancelDeactivateBtn) {
    cancelDeactivateBtn.addEventListener('click', () => {
      accountModal.classList.remove('active');
    });
  }

  // Close modal when overlay is clicked
  if (accountModalOverlay) {
    accountModalOverlay.addEventListener('click', () => {
      accountModal.classList.remove('active');
    });
  }

  // Handle deactivation
  if (deactivateBtn) {
    deactivateBtn.addEventListener('click', async () => {
      // Get user data from localStorage
      const userRaw = localStorage.getItem('memoaUser');
      if (!userRaw) {
        alert('User session not found. Please log in again.');
        return;
      }

      let user;
      try {
        user = JSON.parse(userRaw);
      } catch (err) {
        alert('Failed to parse user session.');
        return;
      }

      console.log('User data:', user);
      console.log('User ID type:', typeof user.id, 'Value:', user.id);

      // Prompt for password confirmation
      const password = prompt(
        'Please enter your password to confirm account deactivation:'
      );
      if (!password) {
        return; // User cancelled
      }

      try {
        // Show loading state
        deactivateBtn.disabled = true;
        deactivateBtn.textContent = 'Deactivating...';

        console.log('Sending deactivation request with userId:', parseInt(user.id, 10));

        // Call backend API to deactivate account
        const apiUrl = 'http://localhost:5000/api/account/deactivate';
        const payload = {
          userId: parseInt(user.id, 10),
          password: password,
        };
        console.log('Payload:', payload);

        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });

        const result = await response.json();

        if (!response.ok) {
          alert(result.message || 'Failed to deactivate account.');
          deactivateBtn.disabled = false;
          deactivateBtn.textContent = 'Deactivate';
          return;
        }

        // Clear all local data
        localStorage.removeItem('memoaUser');
        
        // Clear all user-related data (notes, todos, favourites)
        const keys = Object.keys(localStorage);
        keys.forEach((key) => {
          if (
            key.startsWith('memoaNotes-') ||
            key.startsWith('memoaTodos-') ||
            key.startsWith('memoaFavourites-')
          ) {
            localStorage.removeItem(key);
          }
        });

        // Show success message
        alert('Account successfully deactivated. All your data has been removed.');

        // Redirect to login page
        window.location.href = './login.html';
      } catch (err) {
        console.error('Deactivation error:', err);
        console.error('Error details:', err.message);
        alert('Network error: Could not reach the server at http://localhost:5000. Make sure the Flask server is running.');
        deactivateBtn.disabled = false;
        deactivateBtn.textContent = 'Deactivate';
      }
    });
  }
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', initAccountModal);

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
    deactivateBtn.addEventListener('click', () => {
      // Clear user data from localStorage
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

      // Redirect to login page
      window.location.href = './login.html';
    });
  }
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', initAccountModal);

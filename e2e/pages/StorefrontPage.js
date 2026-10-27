
class StorefrontPage {
  constructor(page) {
    this.page = page;
    this.navigation = page.getByRole('navigation', {
      name: 'Main navigation'
    });
    this.homeLink = this.navigation.getByRole('link', {
      name: 'Home'
    });
    this.productsLink = this.navigation.getByRole('link', {
      name: 'Products'
    });
    this.loginLink = this.navigation.getByRole('link', {
      name: 'Login'
    });
  }

  async goto() {
    await this.page.goto('/');
  }

  async openProducts() {
    await this.productsLink.click();
  }

  async openLogin() {
    await this.loginLink.click();
  }
}

module.exports = { StorefrontPage };

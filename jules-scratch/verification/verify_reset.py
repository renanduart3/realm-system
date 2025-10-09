from playwright.sync_api import sync_playwright, expect

def run_verification(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context()
    page = context.new_page()

    try:
        # Navigate to the settings page
        page.goto("http://localhost:5173/settings", timeout=60000)

        # Click the 'Resetar Sistema' tab
        page.get_by_role("button", name="Resetar Sistema").first.click()

        # Click the 'Resetar Sistema' button to open the dialog
        page.get_by_role("button", name="Resetar Sistema").nth(1).click()

        # Handle the confirmation dialog
        page.get_by_role("button", name="Sim, Resetar").click()

        # Wait for the setup page to load
        expect(page).to_have_url("http://localhost:5173/setup", timeout=30000)

        # Take a screenshot of the setup page
        screenshot_path = "jules-scratch/verification/reset_verification.png"
        page.screenshot(path=screenshot_path)

        print(f"Screenshot saved to {screenshot_path}")

    except Exception as e:
        print(f"An error occurred: {e}")

    finally:
        # Clean up
        context.close()
        browser.close()

if __name__ == "__main__":
    with sync_playwright() as playwright:
        run_verification(playwright)
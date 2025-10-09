from playwright.sync_api import sync_playwright, expect

def run_verification(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context()
    page = context.new_page()

    try:
        # Navigate to the subscription page
        page.goto("http://localhost:5173/subscription", timeout=60000)

        # Wait for the main content to load to ensure the page is ready
        page.wait_for_selector("div.container", timeout=30000)

        # Take a screenshot of the subscription page
        screenshot_path = "jules-scratch/verification/subscription_page.png"
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
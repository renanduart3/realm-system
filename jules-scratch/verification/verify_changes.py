import asyncio
from playwright.async_api import async_playwright, expect

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()

        try:
            # Navigate to the app first to establish the correct security context
            await page.goto("http://localhost:5173/")

            # Clear IndexedDB to ensure a clean state
            await page.evaluate('() => window.indexedDB.deleteDatabase("AppDatabase")')

            # Reload the page to trigger the setup wizard
            await page.reload()

            # --- Complete Setup Wizard ---
            await expect(page.get_by_role("heading", name="Configuração Inicial")).to_be_visible(timeout=10000)

            # Step 1: Organization Information
            await page.get_by_label("Nome da Organização *").fill("Test Non-Profit")
            await page.get_by_label("Tipo de Organização *").select_option("nonprofit")
            await page.get_by_role("button", name="Próximo").click()

            # Step 2: Integrations
            await expect(page.get_by_role("heading", name="Integrações")).to_be_visible()
            await page.get_by_role("button", name="Próximo").click()

            # Step 3: PIX Configuration
            await expect(page.get_by_role("heading", name="Configuração do PIX")).to_be_visible()
            await page.get_by_role("button", name="Próximo").click()

            # Step 4: Subscription
            await expect(page.get_by_role("heading", name="Assinatura")).to_be_visible()
            await page.get_by_role("button", name="Selecionar").first.click() # Select Free plan
            await page.get_by_role("button", name="Finalizar").click()

            # Wait for the main dashboard to load after setup
            await expect(page.get_by_role("heading", name="Dashboard")).to_be_visible(timeout=10000)

            # --- Verification for Persons Page (Non-Profit) ---

            # Go to the Persons page
            await page.get_by_role("link", name="Pessoas").click()
            await expect(page.get_by_role("heading", name="Pessoas")).to_be_visible()

            # Open the 'New Person' modal
            await page.get_by_role("button", name="Nova Pessoa").click()
            await expect(page.get_by_role("heading", name="Nova Pessoa")).to_be_visible()

            # Verify form fields for non-profit
            await expect(page.get_by_label("Renda Familiar")).not_to_be_visible()
            await expect(page.get_by_label("Observações")).not_to_be_visible()
            await expect(page.get_by_label("Data de Nascimento")).to_be_visible()
            await expect(page.get_by_label("Este número possui WhatsApp")).to_be_visible()

            # Take a screenshot of the new person form
            await page.screenshot(path="jules-scratch/verification/persons_form_nonprofit.png")

            # Fill the form to create a new person
            await page.get_by_label("Nome").fill("John Doe")
            await page.get_by_label("Email").fill("john.doe@example.com")
            await page.get_by_label("Telefone").fill("1234567890")
            await page.get_by_label("Este número possui WhatsApp").check()
            await page.get_by_label("Data de Nascimento").fill("1990-01-15")
            await page.get_by_role("button", name="Criar").click()

            # Verify the new person is in the list with correct columns
            await expect(page.get_by_text("John Doe")).to_be_visible()
            await expect(page.get_by_text("15/01/1990")).to_be_visible()
            await expect(page.locator('a[href="https://wa.me/1234567890"]')).to_be_visible()

            # Take a screenshot of the persons list
            await page.screenshot(path="jules-scratch/verification/persons_list_nonprofit.png")

            # --- Verification for Income Page (Non-Profit) ---

            # Go to the Income page
            await page.get_by_role("link", name="Entradas").click()
            await expect(page.get_by_role("heading", name="Entradas")).to_be_visible()

            # Open the 'New Entry' modal
            await page.get_by_role("button", name="Nova Entrada").click()
            await expect(page.get_by_role("heading", name="Nova Entrada")).to_be_visible()

            # Verify the person dropdown is present and contains the new person
            await expect(page.get_by_label("Vincular à Pessoa (Opcional)")).to_be_visible()
            await expect(page.get_by_text("John Doe")).to_be_visible()

            # Take a screenshot of the income form
            await page.screenshot(path="jules-scratch/verification/income_form_nonprofit.png")

        except Exception as e:
            print(f"An error occurred: {e}")
            await page.screenshot(path="jules-scratch/verification/error.png")
        finally:
            await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
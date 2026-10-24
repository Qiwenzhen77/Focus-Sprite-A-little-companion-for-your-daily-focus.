from pathlib import Path

from playwright.sync_api import sync_playwright


PROJECT_ROOT = Path(__file__).resolve().parent
INDEX_URL = (PROJECT_ROOT / "index.html").as_uri()


def main() -> None:
	with sync_playwright() as playwright:
		browser = playwright.chromium.launch()
		page = browser.new_page()
		page_errors = []
		page.on("pageerror", lambda error: page_errors.append(str(error)))

		page.goto(INDEX_URL, wait_until="load")
		assert page.title() == "Focus Sprite — Your Little Focus Buddy"
		assert page.locator("#sprite").is_visible()
		assert page.locator("#taskList").count() == 1

		page.locator("#sprite").hover()
		assert page.locator("body").evaluate(
			"element => element.classList.contains('sprite-hover')"
		)
		page.locator("#taskbar").wait_for(state="visible", timeout=3000)

		page.mouse.move(0, 0)
		page.wait_for_timeout(400)
		assert page.locator("body").evaluate(
			"element => element.classList.contains('sprite-hover')"
		), "The sprite state closed before the 800 ms grace period."

		page.locator("#sprite").hover()
		page.wait_for_timeout(450)
		assert page.locator("body").evaluate(
			"element => element.classList.contains('sprite-hover')"
		), "Returning to the sprite should cancel the close timer."

		page.mouse.move(0, 0)
		page.wait_for_timeout(400)
		page.locator("#taskbar").hover()
		page.wait_for_timeout(450)
		assert page.locator("body").evaluate(
			"element => element.classList.contains('sprite-hover')"
		), "Moving to the taskbar should cancel the close timer."

		page.mouse.move(0, 0)
		page.wait_for_function(
			"!document.body.classList.contains('sprite-hover')",
			timeout=2500,
		)

		page.locator("#openPlanner").click()
		page.locator("#taskTitle").fill("CI smoke test task")
		page.locator("#taskTime").fill("09:30")
		page.locator("#taskDuration").select_option("25")
		page.locator("#taskForm button[type='submit']").click()

		task = page.locator(".task-row").filter(has_text="CI smoke test task")
		task.wait_for(state="visible", timeout=3000)
		task.get_by_role("button", name="Complete").click()
		assert page.locator("#starCount").inner_text() == "1"

		assert not page_errors, f"JavaScript errors occurred: {page_errors}"
		browser.close()

	print("Browser smoke checks passed.")


if __name__ == "__main__":
	main()

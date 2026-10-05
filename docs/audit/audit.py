import asyncio
from playwright.async_api import async_playwright
from PIL import Image
import math
import sys

async def run():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page(viewport={"width": 1440, "height": 900})
        print("Navigating to localhost:5173...")
        await page.goto("http://localhost:5173/login")
        
        # Hide auth panel to see the image better
        await page.evaluate("document.querySelector('.auth-layout__panel').style.opacity = '0.3'")
        
        thumbnails = await page.locator(".tourist-carousel__thumbnail").all()
        num_dest = len(thumbnails)
        print(f"Found {num_dest} thumbnails.")
        
        day_images = []
        night_images = []
        
        # Day Pass
        print("Starting Day Pass...")
        for i in range(num_dest):
            await thumbnails[i].click()
            await page.wait_for_timeout(1000) # wait for transition
            title = await page.locator(".tourist-carousel__place-title").inner_text()
            print(f"Captured Day: {title.strip()}")
            path = f"day_{i}.png"
            await page.screenshot(path=path)
            day_images.append(path)
            
        # Switch Theme
        print("Switching Theme...")
        await page.locator(".auth-theme-pill").click()
        await page.wait_for_timeout(1000)
        
        # Night Pass
        print("Starting Night Pass...")
        for i in range(num_dest):
            await thumbnails[i].click()
            await page.wait_for_timeout(1000)
            title = await page.locator(".tourist-carousel__place-title").inner_text()
            print(f"Captured Night: {title.strip()}")
            path = f"night_{i}.png"
            await page.screenshot(path=path)
            night_images.append(path)
            
        await browser.close()
        
        # Create Contact Sheet
        print("Creating Contact Sheet...")
        cols = 4
        rows = math.ceil((num_dest * 2) / cols)
        
        # Open first image to get dimensions
        sample = Image.open(day_images[0])
        w, h = sample.size
        # scale down
        w = int(w * 0.3)
        h = int(h * 0.3)
        
        grid_w = cols * w
        grid_h = rows * h
        grid = Image.new('RGB', (grid_w, grid_h))
        
        all_paths = []
        for i in range(num_dest):
            all_paths.append(day_images[i])
            all_paths.append(night_images[i])
            
        for idx, p in enumerate(all_paths):
            row = idx // cols
            col = idx % cols
            img = Image.open(p).resize((w, h))
            grid.paste(img, (col * w, row * h))
            
        grid.save('audit_grid.jpg', quality=85)
        print("Done. Saved to audit_grid.jpg")

asyncio.run(run())

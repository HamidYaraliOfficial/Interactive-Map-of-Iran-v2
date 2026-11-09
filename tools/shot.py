from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    b = p.chromium.launch(); pg = b.new_page(viewport={'width':1280,'height':800}); pg.on('pageerror', lambda e: print('ERR', e)); pg.on('console', lambda m: m.type=='error' and print('CON', m.text))
    pg.goto('file:///home/claude/iran-map/index.html'); pg.wait_for_timeout(800)
    pg.screenshot(path='../docs/screenshot-map.png')
    x, y = pg.evaluate("([lo,la])=>{const G=GEO,X=(lo-G.LON0)*Math.PI/180*G.S,Y=(G.M0-Math.log(Math.tan(Math.PI/4+la*Math.PI/360)))*G.S,c=document.getElementById('map').getScreenCTM();return [c.a*X+c.e,c.d*Y+c.f]}", [52.3, 28.6])
    pg.mouse.click(x, y+1); pg.wait_for_timeout(300)
    pg.screenshot(path='../docs/screenshot-modal.png'); b.close()

/**
 * Composite raw viewport captures into webmobilefirst-style framed shots:
 * desktop browser window with the correct inner device (phone / tablet / full desktop).
 */
export function framedCaptureHtml({ deviceType, screenshotBase64, pageUrl, deviceLabel }) {
  const safeUrl = String(pageUrl || 'https://example.com').replace(/"/g, '&quot;');
  const safeLabel = String(deviceLabel || deviceType).replace(/</g, '&lt;');

  const inner =
    deviceType === 'desktop'
      ? `<div class="desktop-screen"><img src="data:image/jpeg;base64,${screenshotBase64}" alt=""></div>`
      : deviceType === 'tablet'
        ? `<div class="tablet-shell">
            <div class="tablet-camera"></div>
            <div class="tablet-screen"><img src="data:image/jpeg;base64,${screenshotBase64}" alt=""></div>
          </div>`
        : `<div class="phone-shell">
            <div class="phone-camera"></div>
            <div class="phone-screen"><img src="data:image/jpeg;base64,${screenshotBase64}" alt=""></div>
          </div>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{
    width:960px;height:640px;background:#e8e8e6;
    display:flex;align-items:center;justify-content:center;
    font-family:"Helvetica Neue",Helvetica,Arial,sans-serif;
  }
  .export-root{width:900px}
  .browser{
    background:#f1f3f4;border-radius:10px;overflow:hidden;
    box-shadow:0 24px 48px rgba(0,0,0,.18),0 0 0 1px rgba(0,0,0,.08);
  }
  .browser-bar{
    display:flex;align-items:center;gap:.55rem;
    padding:.55rem .75rem;background:#dee1e6;border-bottom:1px solid #c4c7cc;
  }
  .dot{width:.62rem;height:.62rem;border-radius:50%}
  .dot-r{background:#ff5f57}.dot-y{background:#febc2e}.dot-g{background:#28c840}
  .address{
    flex:1;background:#fff;border:1px solid #c4c7cc;border-radius:999px;
    padding:.35rem .85rem;font-size:.72rem;color:#3c4043;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;
  }
  .device-pill{
    font-size:.58rem;letter-spacing:.08em;text-transform:uppercase;
    color:#5f6368;font-weight:600;white-space:nowrap;
  }
  .browser-stage{
    background:linear-gradient(180deg,#f8f9fa,#eceff1);
    min-height:520px;display:flex;align-items:center;justify-content:center;padding:1.5rem 1.25rem 1.75rem;
  }
  .phone-shell{
    width:220px;background:linear-gradient(165deg,#2a2a2a,#0a0a0a);
    border-radius:1.65rem;padding:.34rem;position:relative;
    box-shadow:0 18px 36px rgba(0,0,0,.28);
  }
  .phone-shell::before{
    content:"";position:absolute;right:-.1rem;top:28%;width:.12rem;height:2rem;background:#3a3a3a;border-radius:0 2px 2px 0;
    box-shadow:0 2.4rem 0 #3a3a3a;
  }
  .phone-camera{
    position:absolute;top:.55rem;left:50%;transform:translateX(-50%);
    width:.58rem;height:.58rem;border-radius:50%;background:#111;border:1px solid #333;z-index:2;
  }
  .phone-screen{
    border-radius:1.35rem;overflow:hidden;aspect-ratio:393/851;background:#000;
  }
  .phone-screen img{display:block;width:100%;height:100%;object-fit:cover;object-position:top center}
  .tablet-shell{
    width:420px;background:linear-gradient(165deg,#2e2e2e,#111);
    border-radius:1rem;padding:.42rem;position:relative;
    box-shadow:0 18px 36px rgba(0,0,0,.24);
  }
  .tablet-camera{
    position:absolute;top:.42rem;left:50%;transform:translateX(-50%);
    width:.45rem;height:.45rem;border-radius:50%;background:#1a1a1a;border:1px solid #333;z-index:2;
  }
  .tablet-screen{
    border-radius:.72rem;overflow:hidden;aspect-ratio:800/1280;background:#000;
  }
  .tablet-screen img{display:block;width:100%;height:100%;object-fit:cover;object-position:top center}
  .desktop-screen{
    width:100%;max-width:820px;border-radius:6px;overflow:hidden;
    border:1px solid #dadce0;box-shadow:0 8px 24px rgba(0,0,0,.12);background:#fff;
    aspect-ratio:1280/800;
  }
  .desktop-screen img{display:block;width:100%;height:100%;object-fit:cover;object-position:top center}
</style>
</head>
<body>
  <div class="export-root" id="export">
    <div class="browser">
      <div class="browser-bar">
        <span class="dot dot-r"></span><span class="dot dot-y"></span><span class="dot dot-g"></span>
        <div class="address">${safeUrl}</div>
        <span class="device-pill">${safeLabel}</span>
      </div>
      <div class="browser-stage">${inner}</div>
    </div>
  </div>
</body>
</html>`;
}

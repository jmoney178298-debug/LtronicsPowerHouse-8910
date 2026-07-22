import fs from "fs";

const PF_KEY = "1h03inrOn0IIlMP9pcufAQSj9FFDivUXb5Agsx1B";
const EMAIL = "ltronicspowerhouse@yahoo.com";
const PASS = "FuckYouBitch$33";

const products = [
  { dbId: 15, name: "Mens Tee", catalogId: 508, variantId: 12760, placement: "front", w: 1800, h: 2400, design: "https://files.cdn.printful.com/printfile-preview/1008511193/2714b2048c5318999e07d4e59889740b_preview.png" },
  { dbId: 16, name: "Champion Hoodie", catalogId: 842, variantId: 22307, placement: "front", w: 1800, h: 2400, design: "https://files.cdn.printful.com/printfile-preview/1008509125/8d69c7405111126e201d54c8a7fd3f16_preview.png" },
  { dbId: 17, name: "Snapback", catalogId: 99, variantId: 4792, placement: "embroidery_front_large", w: 600, h: 300, design: "https://files.cdn.printful.com/printfile-preview/1008549083/b006092d64f7571a8652955080fb97ae_preview.png" },
  { dbId: 18, name: "Laptop Sleeve", catalogId: 394, variantId: 10984, placement: "default", w: 2250, h: 1725, design: "https://files.cdn.printful.com/printfile-preview/1008545363/6c171ea652e6051820feb501e539dca8_preview.png" },
  { dbId: 19, name: "Stickers", catalogId: 358, variantId: 10163, placement: "default", w: 900, h: 900, design: "https://files.cdn.printful.com/printfile-preview/1008541697/48f1a60bbb5eac2b3c002637581ed8f2_preview.png" },
  { dbId: 20, name: "Sweatshirt", catalogId: 506, variantId: 12696, placement: "front", w: 1800, h: 2400, design: "https://files.cdn.printful.com/printfile-preview/1008556144/5260549768ba14540d92729a472c0cf1_preview.png" },
];

async function pfCreateTask(p) {
  const res = await fetch(`https://api.printful.com/mockup-generator/create-task/${p.catalogId}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${PF_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      variant_ids: [p.variantId],
      format: "jpg",
      files: [{ placement: p.placement, image_url: p.design, position: { area_width: p.w, area_height: p.h, width: p.w, height: p.h, top: 0, left: 0 } }],
    }),
  });
  const json = await res.json();
  if (json.code !== 200) throw new Error(`create-task failed for ${p.name}: ${JSON.stringify(json)}`);
  return json.result.task_key;
}

async function pollTask(taskKey, tries = 15) {
  for (let i = 0; i < tries; i++) {
    await new Promise((r) => setTimeout(r, 3000));
    const res = await fetch(`https://api.printful.com/mockup-generator/task?task_key=${taskKey}`, {
      headers: { Authorization: `Bearer ${PF_KEY}` },
    });
    const json = await res.json();
    if (json.result?.status === "completed") return json.result;
    if (json.result?.status === "failed") throw new Error("Task failed: " + JSON.stringify(json.result));
  }
  throw new Error("Task timed out: " + taskKey);
}

async function login() {
  const r = await fetch("http://localhost:4200/api/auth/sign-in/email", {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: "http://localhost:4200" },
    body: JSON.stringify({ email: EMAIL, password: PASS }),
  });
  return (await r.json()).token;
}

async function uploadToOurS3(token, buf, filename) {
  const r = await fetch("http://localhost:4200/api/upload/presign", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
    body: JSON.stringify({ filename, contentType: "image/jpeg" }),
  });
  const { url, publicUrl } = await r.json();
  await fetch(url, { method: "PUT", headers: { "Content-Type": "image/jpeg" }, body: buf });
  return publicUrl;
}

const token = await login();
console.log("admin token ok:", !!token);

const results = fs.existsSync("/tmp/real_mockups.json") ? JSON.parse(fs.readFileSync("/tmp/real_mockups.json", "utf8")) : {};

for (const p of products) {
  await new Promise((r) => setTimeout(r, 12000)); // throttle to avoid rate limits
  console.log(`\n--- ${p.name} (product ${p.dbId}) ---`);
  try {
    const taskKey = await pfCreateTask(p);
    console.log("task:", taskKey);
    const result = await pollTask(taskKey);
    const mockup = result.mockups?.[0];
    if (!mockup) throw new Error("No mockup returned");

    const urls = [mockup.mockup_url, ...(mockup.extra || []).map((e) => e.url)].filter(Boolean).slice(0, 2);
    console.log("mockup urls:", urls);

    const hostedUrls = [];
    for (let i = 0; i < urls.length; i++) {
      const imgRes = await fetch(urls[i]);
      const buf = Buffer.from(await imgRes.arrayBuffer());
      const hosted = await uploadToOurS3(token, buf, `${p.name.toLowerCase().replace(/\s+/g, "-")}-real-${i}.jpg`);
      hostedUrls.push(hosted);
    }
    results[p.dbId] = hostedUrls;
    console.log("hosted:", hostedUrls);
  } catch (err) {
    console.error(`FAILED for ${p.name}:`, err.message);
    results[p.dbId] = { error: err.message };
  }
}

fs.writeFileSync("/tmp/real_mockups.json", JSON.stringify(results, null, 2));
console.log("\n\nDONE — results saved to /tmp/real_mockups.json");

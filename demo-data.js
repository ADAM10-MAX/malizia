/* ==========================================================================
   MALIZIA — Demo data
   Used only when Supabase credentials are not yet configured in
   js/supabase-client.js, so the storefront is browsable out of the box.
   ========================================================================== */

const DEMO_PRODUCTS = [
  {
    id: "d1",
    title: "Amphora Vase — Sable",
    price: 420,
    image_url: "https://images.unsplash.com/photo-1578500494198-246f612d3b3d?w=600&q=80",
    ai_description:
      "إناء أمفورا بخطوط منحوتة بعناية، يجمع بين البساطة والفخامة. قطعة تضيء أي ركن بهدوئها الترابي وتحول المساحة إلى معرض صغير من الذوق الرفيع.",
    created_at: "2026-06-01T10:00:00Z",
  },
  {
    id: "d2",
    title: "Lampe Bois — Ambre",
    price: 690,
    image_url: "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=600&q=80",
    ai_description:
      "مصباح خشبي بإضاءة عنبرية دافئة، صمم ليمنح غرفتك طابعا حميميا عند حلول المساء. تفاصيله اليدوية تجعل منه قطعة مضيئة بروح أصيلة.",
    created_at: "2026-06-02T10:00:00Z",
  },
  {
    id: "d3",
    title: "Coussin Lin — Argile",
    price: 190,
    image_url: "https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?w=600&q=80",
    ai_description:
      "وسادة من الكتان الطبيعي بلون الطين، ناعمة الملمس وأنيقة الحضور. تضيف دفئا بصريا لأي أريكة وتدعو للاسترخاء بلمسة راقية.",
    created_at: "2026-06-03T10:00:00Z",
  },
  {
    id: "d4",
    title: "Miroir Laiton — Cercle",
    price: 540,
    image_url: "https://images.unsplash.com/photo-1618220179428-22790b461013?w=600&q=80",
    ai_description:
      "مرآة دائرية بإطار نحاسي مصقول، تعكس الضوء بأناقة وتمنح الجدار لمسة معدنية راقية. تفصيل بسيط يترك أثرا كبيرا في الديكور.",
    created_at: "2026-06-04T10:00:00Z",
  },
  {
    id: "d5",
    title: "Panier Tressé — Naturel",
    price: 260,
    image_url: "https://images.unsplash.com/photo-1595428774223-ef52624120d2?w=600&q=80",
    ai_description:
      "سلة منسوجة يدويا من ألياف طبيعية، عملية وجميلة في آن واحد. مثالية لتنظيم المساحة مع الحفاظ على طابع دافئ وريفي أنيق.",
    created_at: "2026-06-05T10:00:00Z",
  },
  {
    id: "d6",
    title: "Bougie Parfumée — Santal",
    price: 150,
    image_url: "https://images.unsplash.com/photo-1602874801007-bd457d2c2c37?w=600&q=80",
    ai_description:
      "شمعة معطرة برائحة خشب الصندل الدافئة، مصبوبة في وعاء سيراميك أنيق. رفيقة مثالية للأمسيات الهادئة ولحظات الاسترخاء في المنزل.",
    created_at: "2026-06-06T10:00:00Z",
  },
];

function getDemoProductById(id) {
  return DEMO_PRODUCTS.find((p) => String(p.id) === String(id)) || null;
}

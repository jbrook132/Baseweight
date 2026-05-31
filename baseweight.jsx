import React, { useState, useEffect, useMemo, useRef } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import {
  Plus, X, Star, Trash2, Settings, ChevronDown, Check, Pencil,
  Copy, Mountain, Package, ListChecks, PlayCircle, Coffee
} from "lucide-react";

/* ----------------------------------------------------------------
   BASEWEIGHT — a LighterPack-style backpacking gear list
   Mobile-first PWA-ready artifact. Data persists via window.storage.
----------------------------------------------------------------- */

const C = {
  paper: "#EDE6D6",
  paperAlt: "#E4DAC4",
  card: "#F6F1E6",
  ink: "#26231C",
  inkSoft: "#6B6353",
  line: "#D6CAB1",
  lineSoft: "#E3D9C4",
  accent: "#3A6B4F",
  accentDeep: "#2A4F3A",
  pine: "#2F4B3F",
  good: "#3F6B4C",
};

const PALETTE = [
  "#3F7A6B", "#2F4B3F", "#3A6B8C", "#B58A2B", "#7A5C3E",
  "#8C4A52", "#566B33", "#46506E", "#A0703A", "#5B7E78",
];

const CURRENCIES = { USD: "$", AUD: "A$", GBP: "£", EUR: "€", CAD: "C$" };

const uid = () => Math.random().toString(36).slice(2, 9);
const G_PER = { g: 1, kg: 1000, oz: 28.3495, lb: 453.592 };
const toGrams = (w, u) => (Number(w) || 0) * (G_PER[u] || 1);

function fmtWeight(grams, system) {
  if (!grams) return system === "metric" ? "0 g" : "0 oz";
  if (system === "metric") {
    if (grams >= 1000) return (grams / 1000).toFixed(2) + " kg";
    return Math.round(grams) + " g";
  }
  const oz = grams / 28.3495;
  if (oz >= 16) {
    const lb = Math.floor(oz / 16);
    const rem = oz - lb * 16;
    return lb + " lb " + rem.toFixed(1) + " oz";
  }
  return oz.toFixed(1) + " oz";
}

function bigWeight(grams, system) {
  // returns { num, unit } for a large hero readout
  if (system === "metric") {
    if (grams >= 1000) return { num: (grams / 1000).toFixed(2), unit: "kg" };
    return { num: String(Math.round(grams)), unit: "g" };
  }
  const oz = grams / 28.3495;
  if (oz >= 16) return { num: (oz / 16).toFixed(2), unit: "lb" };
  return { num: oz.toFixed(1), unit: "oz" };
}

function seed() {
  const cat = (name, color, items) => ({ id: uid(), name, color, items: items.map(i => ({ id: uid(), star: false, worn: false, consumable: false, desc: "", price: 0, qty: 1, unit: "g", ...i })) });
  return {
    system: "imperial",
    currency: "AUD",
    activeListId: "cwt",
    lists: [
      {
        id: "cwt",
        name: "Cape Wrath Trail",
        categories: [
          cat("Pack", PALETTE[0], [
            { name: "Rucksack", desc: "Mo 60L Rucksack", weight: 1132 },
          ]),
          cat("Shelter", PALETTE[1], [
            { name: "Tent", desc: "Durston X-Mid 1 Pro", weight: 530 },
            { name: "Tent Pegs", desc: "Big Agnes UL", qty: 10, weight: 10 },
          ]),
          cat("Sleep System", PALETTE[2], [
            { name: "Quilt", desc: "Neave Gear Waratah Quilt", weight: 630 },
            { name: "Sleeping Mat", desc: "Nemo Tensor", weight: 650 },
            { name: "Liner", desc: "Tioga Sleep Liner – Western Mountaineering", weight: 105 },
            { name: "Pillow", desc: "Sea to Summit Aeros", weight: 60 },
          ]),
          cat("Kitchen", PALETTE[3], [
            { name: "Stove", desc: "Soto stove", weight: 87 },
            { name: "Pot", desc: "Toakes 750ml", weight: 103 },
            { name: "Spork", desc: "Sea to Summit AlphaLight", weight: 12 },
            { name: "Cup", desc: "Sea to Summit Foldable", weight: 55 },
          ]),
          cat("Water & Filtration", PALETTE[7], [
            { name: "Water Filter", desc: "Katadyn BeFree 1.0L", weight: 64 },
            { name: "Extra 2L Bladder", weight: 80 },
          ]),
          cat("Clothing (Packed)", PALETTE[4], [
            { name: "Synthetic Jacket", weight: 350 },
            { name: "Rain Jacket", desc: "Kathmandu", weight: 300 },
            { name: "Thermal Top", desc: "Patagonia", weight: 180 },
            { name: "Spare Dry Clothes", weight: 350 },
            { name: "Spare Socks", weight: 80 },
          ]),
          cat("Clothing (Worn)", PALETTE[6], [
            { name: "Merino Wool Socks", desc: "Darn Tough", weight: 80, worn: true },
            { name: "Trail Runners", desc: "Brooks Cascadia 18", weight: 821, worn: true },
            { name: "Shorts", desc: "General sports shorts", weight: 160, worn: true },
            { name: "Cap", desc: "Nike Tailwind", weight: 70, worn: true },
            { name: "T-Shirt", desc: "Merino Wool Icebreaker", weight: 140, worn: true },
            { name: "Hiking Poles", desc: "Durston Iceline", qty: 2, weight: 135, worn: true },
            { name: "Oakley Sunglasses", weight: 50, worn: true },
          ]),
          cat("Electronics", PALETTE[5], [
            { name: "iPhone 13", desc: "Offline maps navigation", weight: 170 },
            { name: "Garmin Enduro 3", desc: "Nav watch", weight: 63 },
            { name: "Nitecore NB 20000", desc: "Primary charger", weight: 306 },
            { name: "Nitecore NB 10000", desc: "Backup charger", weight: 150 },
            { name: "Charging Cords", desc: "iPhone, watch, PLB, GoPro", qty: 4, weight: 10 },
            { name: "Garmin inReach Mini 2", desc: "PLB / Satellite comms", weight: 100 },
            { name: "AirPods", weight: 45 },
          ]),
          cat("First Aid & Misc", PALETTE[8], [
            { name: "First Aid Kit", desc: "Bandaids, blister Mx, gauze, antiseptic", weight: 50 },
            { name: "Dry Bags", desc: "Waterproofing", qty: 3, weight: 40 },
            { name: "DCF Pack Liner", desc: "Waterproofing", weight: 40 },
            { name: "Toothbrush", desc: "UL toothbrush", weight: 12 },
            { name: "Trowel", weight: 17 },
            { name: "Earplugs", qty: 6, weight: 2 },
            { name: "Midge Off", weight: 50 },
            { name: "Trail Guide", desc: "Cicerone CWT", weight: 200 },
          ]),
          cat("Food", PALETTE[9], [
            { name: "Freeze Dried Meals", desc: "Dinner", qty: 3, weight: 125, consumable: true },
            { name: "Jerky", desc: "Snacks", qty: 2, weight: 50, consumable: true },
            { name: "Snakes", desc: "Snake lollies", qty: 2, weight: 100, consumable: true },
            { name: "Coffee Grinds", desc: "Pre-made", weight: 100, consumable: true },
            { name: "Water", weight: 250, consumable: true },
          ]),
          cat("Consumables", PALETTE[0], [
            { name: "Gas", weight: 230, consumable: true },
            { name: "Sunscreen", weight: 125, consumable: true },
            { name: "Wet Wipes", weight: 90, consumable: true },
            { name: "Hand Sanitiser", weight: 30, consumable: true },
            { name: "Toothpaste", weight: 40, consumable: true },
            { name: "Toilet Paper", weight: 20, consumable: true },
            { name: "Zinc", weight: 12, consumable: true },
            { name: "Lip Balm", weight: 10, consumable: true },
            { name: "Dental Floss", weight: 5 },
          ]),
          cat("Film Gear", PALETTE[3], [
            { name: "GoPro Hero (Mission 1)", desc: "Camera body + 1 battery", weight: 210 },
            { name: "GoPro Batteries", desc: "Enduro 2", qty: 5, weight: 33 },
          ]),
        ],
      },
      {
        id: "demo",
        name: "My Setup",
        categories: [
          cat("The Big Three", PALETTE[1], [
            { name: "Backpack", weight: 1190, price: 240, desc: "60L frameless" },
            { name: "Tent", weight: 1080, price: 350 },
            { name: "Quilt", weight: 620, price: 300 },
            { name: "Sleeping pad", weight: 460, price: 200 },
          ]),
          cat("Kitchen", PALETTE[3], [
            { name: "Canister stove", weight: 75, price: 45 },
            { name: "Pot 750ml", weight: 130, price: 40 },
            { name: "Long spork", weight: 11, price: 9 },
            { name: "Mini lighter", weight: 11, price: 2 },
          ]),
          cat("Worn", PALETTE[0], [
            { name: "Trail runners", weight: 620, price: 140, worn: true },
            { name: "Sun hoody", weight: 150, price: 60, worn: true },
            { name: "Hiking shorts", weight: 180, price: 55, worn: true },
            { name: "Cap", weight: 60, price: 25, worn: true },
          ]),
          cat("Packed Clothing", PALETTE[4], [
            { name: "Rain jacket", weight: 230, price: 130 },
            { name: "Down jacket", weight: 280, price: 220 },
            { name: "Spare socks", weight: 60, price: 18, qty: 2 },
          ]),
          cat("Electronics", PALETTE[5], [
            { name: "Phone", weight: 200 },
            { name: "Headlamp", weight: 40, price: 35 },
            { name: "Power bank 10k", weight: 210, price: 40 },
            { name: "Cables", weight: 40, price: 15 },
          ]),
          cat("Consumables", PALETTE[6], [
            { name: "Food (3 days)", weight: 2100, consumable: true },
            { name: "Water (1.5L)", weight: 1500, consumable: true },
            { name: "Fuel", weight: 100, consumable: true, price: 8 },
          ]),
        ],
      },
    ],
  };
}

const STORAGE_KEY = "baseweight:v2";

export default function App() {
  const [data, setData] = useState(null);
  const [view, setView] = useState("pack");
  const [editing, setEditing] = useState(null); // {catId, item}
  const [catEdit, setCatEdit] = useState(null); // category obj or {new:true}
  const [showLists, setShowLists] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // load
  useEffect(() => {
    (async () => {
      try {
        const r = await window.storage.get(STORAGE_KEY);
        if (r && r.value) { setData(JSON.parse(r.value)); return; }
      } catch (e) { /* no key yet */ }
      setData(seed());
    })();
  }, []);

  // save
  useEffect(() => {
    if (!data) return;
    window.storage.set(STORAGE_KEY, JSON.stringify(data)).catch(() => {});
  }, [data]);

  const mutate = (fn) => setData(d => { const nd = structuredClone(d); fn(nd); return nd; });

  if (!data) return <Loading />;

  const list = data.lists.find(l => l.id === data.activeListId) || data.lists[0];
  const sym = CURRENCIES[data.currency] || "$";

  // ---- stats ----
  const stats = computeStats(list);
  const base = bigWeight(stats.base, data.system);

  // ---- mutations ----
  const addCategory = (name, color) => mutate(d => {
    const l = d.lists.find(x => x.id === d.activeListId);
    l.categories.push({ id: uid(), name: name || "New category", color, items: [] });
  });
  const updateCategory = (id, patch) => mutate(d => {
    const l = d.lists.find(x => x.id === d.activeListId);
    const c = l.categories.find(x => x.id === id); Object.assign(c, patch);
  });
  const deleteCategory = (id) => mutate(d => {
    const l = d.lists.find(x => x.id === d.activeListId);
    l.categories = l.categories.filter(x => x.id !== id);
  });
  const saveItem = (catId, item) => mutate(d => {
    const l = d.lists.find(x => x.id === d.activeListId);
    const c = l.categories.find(x => x.id === catId);
    const idx = c.items.findIndex(i => i.id === item.id);
    if (idx >= 0) c.items[idx] = item; else c.items.push(item);
  });
  const deleteItem = (catId, itemId) => mutate(d => {
    const l = d.lists.find(x => x.id === d.activeListId);
    const c = l.categories.find(x => x.id === catId);
    c.items = c.items.filter(i => i.id !== itemId);
  });
  const toggleField = (catId, itemId, field) => mutate(d => {
    const l = d.lists.find(x => x.id === d.activeListId);
    const c = l.categories.find(x => x.id === catId);
    const i = c.items.find(x => x.id === itemId); i[field] = !i[field];
  });

  return (
    <div style={S.root}>
      <style>{CSS}</style>
      <div style={S.topo} />

      <div style={S.shell}>
        {/* Header */}
        <header style={S.header}>
          <button style={S.listBtn} onClick={() => setShowLists(true)}>
            <Mountain size={18} color={C.accent} strokeWidth={2.4} />
            <span style={S.listName}>{list.name}</span>
            <ChevronDown size={16} color={C.inkSoft} />
          </button>
          <button style={S.iconBtn} onClick={() => setShowSettings(true)} aria-label="Settings">
            <Settings size={19} color={C.inkSoft} />
          </button>
        </header>

        {/* Hero base weight */}
        <div style={S.hero}>
          <div style={S.heroLabel}>BASE WEIGHT</div>
          <div style={S.heroRow}>
            <span style={S.heroNum}>{base.num}</span>
            <span style={S.heroUnit}>{base.unit}</span>
          </div>
          <div style={S.heroSub}>
            <span>Pack {fmtWeight(stats.pack, data.system)}</span>
            <span style={S.dot}>·</span>
            <span>Total {fmtWeight(stats.total, data.system)}</span>
            <span style={S.dot}>·</span>
            <span>{sym}{stats.price.toFixed(0)}</span>
          </div>
        </div>

        {/* Segmented */}
        <div style={S.seg}>
          {["pack", "chart"].map(v => (
            <button key={v} onClick={() => setView(v)}
              style={{ ...S.segBtn, ...(view === v ? S.segOn : {}) }}>
              {v === "pack" ? "Pack" : "Breakdown"}
            </button>
          ))}
        </div>

        {/* Body */}
        <main style={S.main}>
          {view === "pack" ? (
            <PackView
              list={list} stats={stats} system={data.system} sym={sym}
              onAddItem={(catId) => setEditing({ catId, item: blankItem() })}
              onEditItem={(catId, item) => setEditing({ catId, item })}
              onToggle={toggleField}
              onEditCat={(c) => setCatEdit(c)}
              onAddCat={() => setCatEdit({ new: true, color: PALETTE[list.categories.length % PALETTE.length] })}
            />
          ) : (
            <ChartView list={list} stats={stats} system={data.system} sym={sym} />
          )}
        </main>
      </div>

      {/* Item editor */}
      {editing && (
        <ItemEditor
          init={editing.item} system={data.system} sym={sym}
          onClose={() => setEditing(null)}
          onSave={(it) => { saveItem(editing.catId, it); setEditing(null); }}
          onDelete={editing.item._new ? null : () => { deleteItem(editing.catId, editing.item.id); setEditing(null); }}
        />
      )}

      {/* Category editor */}
      {catEdit && (
        <CatEditor
          init={catEdit}
          onClose={() => setCatEdit(null)}
          onSave={(name, color) => {
            if (catEdit.new) addCategory(name, color);
            else updateCategory(catEdit.id, { name, color });
            setCatEdit(null);
          }}
          onDelete={catEdit.new ? null : () => { deleteCategory(catEdit.id); setCatEdit(null); }}
        />
      )}

      {/* Lists sheet */}
      {showLists && (
        <ListsSheet
          data={data} onClose={() => setShowLists(false)}
          onPick={(id) => { mutate(d => { d.activeListId = id; }); setShowLists(false); }}
          onAdd={() => mutate(d => { const id = uid(); d.lists.push({ id, name: "New list", categories: [] }); d.activeListId = id; })}
          onRename={(id, name) => mutate(d => { d.lists.find(l => l.id === id).name = name; })}
          onDuplicate={(id) => mutate(d => { const src = d.lists.find(l => l.id === id); const copy = structuredClone(src); copy.id = uid(); copy.name = src.name + " copy"; d.lists.push(copy); d.activeListId = copy.id; })}
          onDelete={(id) => mutate(d => { if (d.lists.length <= 1) return; d.lists = d.lists.filter(l => l.id !== id); if (d.activeListId === id) d.activeListId = d.lists[0].id; })}
        />
      )}

      {/* Settings sheet */}
      {showSettings && (
        <SettingsSheet
          data={data} onClose={() => setShowSettings(false)}
          onSystem={(s) => mutate(d => { d.system = s; })}
          onCurrency={(c) => mutate(d => { d.currency = c; })}
        />
      )}
    </div>
  );
}

/* ----------------------------- views ----------------------------- */

function PackView({ list, stats, system, sym, onAddItem, onEditItem, onToggle, onEditCat, onAddCat }) {
  if (list.categories.length === 0) {
    return (
      <div style={S.empty}>
        <Package size={40} color={C.line} strokeWidth={1.6} />
        <p style={S.emptyText}>No categories yet.</p>
        <button style={S.primaryBtn} onClick={onAddCat}>
          <Plus size={16} /> Add a category
        </button>
      </div>
    );
  }
  return (
    <div className="bw-fade">
      {list.categories.map(cat => {
        const ct = stats.cats[cat.id];
        const pct = stats.total ? Math.round((ct.grams / stats.total) * 100) : 0;
        return (
          <section key={cat.id} style={S.cat}>
            <button style={S.catHead} onClick={() => onEditCat(cat)}>
              <span style={{ ...S.swatch, background: cat.color }} />
              <span style={S.catName}>{cat.name}</span>
              <span style={S.catMeta}>{fmtWeight(ct.grams, system)} · {pct}%</span>
            </button>

            <div style={S.items}>
              {cat.items.map(item => {
                const g = toGrams(item.weight, item.unit) * (item.qty || 1);
                return (
                  <div key={item.id} style={S.item}>
                    <button style={S.itemMain} onClick={() => onEditItem(cat.id, item)}>
                      <div style={S.itemTop}>
                        {(item.qty || 1) > 1 && <span style={S.qty}>{item.qty}×</span>}
                        <span style={S.itemName}>{item.name || "Untitled"}</span>
                        {item.star && <Star size={13} fill={C.accent} color={C.accent} />}
                        {item.worn && <Tag t="WORN" />}
                        {item.consumable && <Tag t="CONS" />}
                      </div>
                      {item.desc ? <div style={S.itemDesc}>{item.desc}</div> : null}
                    </button>
                    <div style={S.itemRight}>
                      {item.price ? <span style={S.price}>{sym}{(item.price * (item.qty || 1)).toFixed(0)}</span> : null}
                      <span style={S.itemWt}>{fmtWeight(g, system)}</span>
                    </div>
                  </div>
                );
              })}
              <button style={S.addItem} onClick={() => onAddItem(cat.id)}>
                <Plus size={15} color={C.accent} /> Add item
              </button>
            </div>
          </section>
        );
      })}
      <button style={S.addCat} onClick={onAddCat}>
        <Plus size={16} color={C.inkSoft} /> Add category
      </button>
      <div style={{ height: 24 }} />
    </div>
  );
}

function ChartView({ list, stats, system, sym }) {
  const slices = list.categories
    .map(c => ({ name: c.name, color: c.color, value: stats.cats[c.id].grams }))
    .filter(s => s.value > 0);

  const rows = [
    { label: "Base weight", g: stats.base, hint: "total − worn − consumable", strong: true },
    { label: "Pack weight", g: stats.pack, hint: "on/in your pack" },
    { label: "Worn", g: stats.worn },
    { label: "Consumable", g: stats.consumable },
    { label: "Total weight", g: stats.total, strong: true },
  ];

  return (
    <div className="bw-fade">
      <div style={S.chartWrap}>
        {slices.length === 0 ? (
          <p style={S.emptyText}>Add some items to see the breakdown.</p>
        ) : (
          <div style={{ width: "100%", height: 230, position: "relative" }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie data={slices} dataKey="value" innerRadius={62} outerRadius={92}
                  paddingAngle={2} stroke="none" startAngle={90} endAngle={-270}>
                  {slices.map((s, i) => <Cell key={i} fill={s.color} />)}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div style={S.donutCenter}>
              <div style={S.donutNum}>{bigWeight(stats.total, system).num}</div>
              <div style={S.donutUnit}>{bigWeight(stats.total, system).unit} total</div>
            </div>
          </div>
        )}
      </div>

      <div style={S.legend}>
        {slices.sort((a, b) => b.value - a.value).map((s, i) => {
          const pct = stats.total ? Math.round((s.value / stats.total) * 100) : 0;
          return (
            <div key={i} style={S.legendRow}>
              <span style={{ ...S.swatch, background: s.color }} />
              <span style={S.legendName}>{s.name}</span>
              <span style={S.legendBarTrack}>
                <span style={{ ...S.legendBar, width: pct + "%", background: s.color }} />
              </span>
              <span style={S.legendVal}>{fmtWeight(s.value, system)}</span>
            </div>
          );
        })}
      </div>

      <div style={S.statBox}>
        {rows.map((r, i) => (
          <div key={i} style={{ ...S.statRow, ...(r.strong ? S.statStrong : {}), borderBottom: i < rows.length - 1 ? `1px solid ${C.lineSoft}` : "none" }}>
            <div>
              <div style={S.statLabel}>{r.label}</div>
              {r.hint && <div style={S.statHint}>{r.hint}</div>}
            </div>
            <div style={S.statVal}>{fmtWeight(r.g, system)}</div>
          </div>
        ))}
        <div style={{ ...S.statRow, borderTop: `2px solid ${C.line}`, borderBottom: "none" }}>
          <div style={S.statLabel}>Total cost</div>
          <div style={S.statVal}>{sym}{stats.price.toFixed(0)}</div>
        </div>
      </div>
      <div style={{ height: 24 }} />
    </div>
  );
}

/* ----------------------------- editors ----------------------------- */

function ItemEditor({ init, system, sym, onClose, onSave, onDelete }) {
  const [it, setIt] = useState(init);
  const set = (k, v) => setIt(p => ({ ...p, [k]: v }));
  const units = system === "metric" ? ["g", "kg"] : ["oz", "lb"];
  // make sure current unit is offered
  const allUnits = Array.from(new Set([...units, "g", "kg", "oz", "lb"]));

  return (
    <Sheet onClose={onClose} title={init._new ? "New item" : "Edit item"}>
      <Field label="Name">
        <input style={S.input} value={it.name} autoFocus={init._new}
          onChange={e => set("name", e.target.value)} placeholder="e.g. Backpack" />
      </Field>
      <Field label="Description">
        <input style={S.input} value={it.desc}
          onChange={e => set("desc", e.target.value)} placeholder="optional" />
      </Field>

      <div style={S.row3}>
        <Field label="Qty">
          <input style={S.input} inputMode="numeric" value={it.qty}
            onChange={e => set("qty", Math.max(1, parseInt(e.target.value || "1")))} />
        </Field>
        <Field label="Weight">
          <input style={S.input} inputMode="decimal" value={it.weight}
            onChange={e => set("weight", e.target.value.replace(/[^0-9.]/g, ""))} />
        </Field>
        <Field label="Unit">
          <div style={S.unitWrap}>
            {allUnits.map(u => (
              <button key={u} onClick={() => set("unit", u)}
                style={{ ...S.unitBtn, ...(it.unit === u ? S.unitOn : {}) }}>{u}</button>
            ))}
          </div>
        </Field>
      </div>

      <Field label={`Price (${sym})`}>
        <input style={S.input} inputMode="decimal" value={it.price}
          onChange={e => set("price", parseFloat(e.target.value.replace(/[^0-9.]/g, "")) || 0)} placeholder="0" />
      </Field>

      <div style={S.toggles}>
        <Toggle on={it.worn} label="Worn" hint="Worn, not carried" onClick={() => set("worn", !it.worn)} />
        <Toggle on={it.consumable} label="Consumable" hint="Food · water · fuel" onClick={() => set("consumable", !it.consumable)} />
        <Toggle on={it.star} label="Star" icon onClick={() => set("star", !it.star)} />
      </div>

      <button style={S.primaryBtn} onClick={() => onSave({ ...it, _new: undefined })}>
        <Check size={17} /> Save item
      </button>
      {onDelete && (
        <button style={S.deleteBtn} onClick={onDelete}>
          <Trash2 size={16} /> Delete item
        </button>
      )}
    </Sheet>
  );
}

function CatEditor({ init, onClose, onSave, onDelete }) {
  const [name, setName] = useState(init.new ? "" : init.name);
  const [color, setColor] = useState(init.color || PALETTE[0]);
  return (
    <Sheet onClose={onClose} title={init.new ? "New category" : "Edit category"}>
      <Field label="Name">
        <input style={S.input} value={name} autoFocus
          onChange={e => setName(e.target.value)} placeholder="e.g. Kitchen" />
      </Field>
      <Field label="Colour">
        <div style={S.colorWrap}>
          {PALETTE.map(p => (
            <button key={p} onClick={() => setColor(p)}
              style={{ ...S.colorDot, background: p, outline: color === p ? `3px solid ${C.ink}` : "none", outlineOffset: 2 }} />
          ))}
        </div>
      </Field>
      <button style={S.primaryBtn} onClick={() => onSave(name.trim() || "Category", color)}>
        <Check size={17} /> Save
      </button>
      {onDelete && (
        <button style={S.deleteBtn} onClick={onDelete}>
          <Trash2 size={16} /> Delete category
        </button>
      )}
    </Sheet>
  );
}

function ListsSheet({ data, onClose, onPick, onAdd, onRename, onDuplicate, onDelete }) {
  const [renaming, setRenaming] = useState(null);
  const [tmp, setTmp] = useState("");
  return (
    <Sheet onClose={onClose} title="Your lists">
      {data.lists.map(l => (
        <div key={l.id} style={{ ...S.listItem, ...(l.id === data.activeListId ? S.listItemOn : {}) }}>
          {renaming === l.id ? (
            <input style={{ ...S.input, flex: 1 }} value={tmp} autoFocus
              onChange={e => setTmp(e.target.value)}
              onBlur={() => { onRename(l.id, tmp.trim() || l.name); setRenaming(null); }}
              onKeyDown={e => { if (e.key === "Enter") { onRename(l.id, tmp.trim() || l.name); setRenaming(null); } }} />
          ) : (
            <button style={S.listPick} onClick={() => onPick(l.id)}>
              <ListChecks size={16} color={l.id === data.activeListId ? C.accent : C.inkSoft} />
              <span style={{ fontWeight: l.id === data.activeListId ? 700 : 500 }}>{l.name}</span>
            </button>
          )}
          <button style={S.miniBtn} onClick={() => { setRenaming(l.id); setTmp(l.name); }}><Pencil size={14} color={C.inkSoft} /></button>
          <button style={S.miniBtn} onClick={() => onDuplicate(l.id)}><Copy size={14} color={C.inkSoft} /></button>
          {data.lists.length > 1 && (
            <button style={S.miniBtn} onClick={() => onDelete(l.id)}><Trash2 size={14} color={C.accentDeep} /></button>
          )}
        </div>
      ))}
      <button style={S.primaryBtn} onClick={onAdd}><Plus size={16} /> New list</button>
    </Sheet>
  );
}

function SettingsSheet({ data, onClose, onSystem, onCurrency }) {
  return (
    <Sheet onClose={onClose} title="Settings">
      <Field label="Units">
        <div style={S.unitWrap}>
          <button onClick={() => onSystem("imperial")} style={{ ...S.bigToggle, ...(data.system === "imperial" ? S.unitOn : {}) }}>Imperial (oz / lb)</button>
          <button onClick={() => onSystem("metric")} style={{ ...S.bigToggle, ...(data.system === "metric" ? S.unitOn : {}) }}>Metric (g / kg)</button>
        </div>
      </Field>
      <Field label="Currency">
        <div style={S.unitWrap}>
          {Object.keys(CURRENCIES).map(c => (
            <button key={c} onClick={() => onCurrency(c)}
              style={{ ...S.unitBtn, ...(data.currency === c ? S.unitOn : {}) }}>{c}</button>
          ))}
        </div>
      </Field>
      <p style={S.note}>
        Tip: in Safari, tap Share → <b>Add to Home Screen</b> to run this full-screen like a native app.
        Your lists are saved on this device automatically.
      </p>

      <div style={S.aboutBox}>
        <div style={S.aboutLabel}>ABOUT</div>
        <p style={S.aboutText}>
          Created and used by hiker &amp; YouTuber <b>Jack Brookes</b>.
        </p>
        <a href="https://www.youtube.com/@jackbrookes" target="_blank" rel="noopener noreferrer" style={S.ytBtn}>
          <PlayCircle size={17} color="#fff" /> Watch on YouTube
        </a>
        <a href="https://buymeacoffee.com/jackbrookes" target="_blank" rel="noopener noreferrer" style={S.coffeeBtn}>
          <Coffee size={16} color={C.ink} /> Buy me a coffee
        </a>
        <p style={S.supportNote}>
          Baseweight is free. If it's useful on trail, a coffee keeps it going.
        </p>
      </div>
    </Sheet>
  );
}

/* ----------------------------- primitives ----------------------------- */

function Sheet({ title, onClose, children }) {
  return (
    <div style={S.backdrop} onClick={onClose}>
      <div style={S.sheet} className="bw-sheet" onClick={e => e.stopPropagation()}>
        <div style={S.sheetHandle} />
        <div style={S.sheetHead}>
          <h2 style={S.sheetTitle}>{title}</h2>
          <button style={S.iconBtn} onClick={onClose}><X size={20} color={C.inkSoft} /></button>
        </div>
        <div style={S.sheetBody}>{children}</div>
      </div>
    </div>
  );
}

const Field = ({ label, children }) => (
  <div style={{ marginBottom: 14 }}>
    <label style={S.fieldLabel}>{label}</label>
    {children}
  </div>
);

const Tag = ({ t }) => (
  <span style={{ ...S.tag, background: t === "WORN" ? "#E7DFC9" : "#E2EAD9", color: t === "WORN" ? "#7A5C3E" : "#4D6B3A" }}>{t}</span>
);

function Toggle({ on, label, hint, icon, onClick }) {
  return (
    <button onClick={onClick} style={{ ...S.toggle, ...(on ? S.toggleOn : {}) }}>
      {icon ? <Star size={15} fill={on ? "#fff" : "none"} color={on ? "#fff" : C.inkSoft} /> : null}
      <div style={{ textAlign: "left" }}>
        <div style={{ fontWeight: 700, fontSize: 14 }}>{label}</div>
        {hint && <div style={{ fontSize: 10.5, opacity: 0.8 }}>{hint}</div>}
      </div>
    </button>
  );
}

const Loading = () => (
  <div style={{ ...S.root, display: "flex", alignItems: "center", justifyContent: "center" }}>
    <style>{CSS}</style>
    <Mountain size={34} color={C.accent} className="bw-pulse" />
  </div>
);

/* ----------------------------- helpers ----------------------------- */

function blankItem() {
  return { id: uid(), name: "", desc: "", qty: 1, weight: "", unit: "g", price: 0, worn: false, consumable: false, star: false, _new: true };
}

function computeStats(list) {
  let total = 0, worn = 0, consumable = 0, price = 0;
  const cats = {};
  for (const c of list.categories) {
    let cg = 0, cp = 0;
    for (const i of c.items) {
      const g = toGrams(i.weight, i.unit) * (i.qty || 1);
      cg += g; total += g;
      const p = (Number(i.price) || 0) * (i.qty || 1);
      cp += p; price += p;
      if (i.worn) worn += g;
      if (i.consumable) consumable += g;
    }
    cats[c.id] = { grams: cg, price: cp };
  }
  return { total, worn, consumable, price, base: total - worn - consumable, pack: total - worn, cats };
}

/* ----------------------------- styles ----------------------------- */

const SAFE_T = "env(safe-area-inset-top, 0px)";
const SAFE_B = "env(safe-area-inset-bottom, 0px)";

const S = {
  root: { position: "fixed", inset: 0, background: C.paper, color: C.ink, fontFamily: "'Archivo', sans-serif", overflow: "hidden", WebkitFontSmoothing: "antialiased" },
  topo: { position: "absolute", inset: 0, opacity: 0.5, pointerEvents: "none", backgroundImage: "radial-gradient(circle at 20% 12%, transparent 38%, rgba(150,128,90,0.10) 39%, transparent 40%), radial-gradient(circle at 20% 12%, transparent 52%, rgba(150,128,90,0.08) 53%, transparent 54%), radial-gradient(circle at 82% 78%, transparent 30%, rgba(150,128,90,0.09) 31%, transparent 32%), radial-gradient(circle at 82% 78%, transparent 46%, rgba(150,128,90,0.07) 47%, transparent 48%)" },
  shell: { position: "relative", height: "100%", maxWidth: 480, margin: "0 auto", display: "flex", flexDirection: "column", zIndex: 1 },

  header: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: `calc(${SAFE_T} + 12px) 16px 8px` },
  listBtn: { display: "flex", alignItems: "center", gap: 8, background: "none", border: "none", padding: "4px 0", cursor: "pointer" },
  listName: { fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 700, fontSize: 18, color: C.ink, letterSpacing: -0.3 },
  iconBtn: { background: "none", border: "none", padding: 6, cursor: "pointer", borderRadius: 10, display: "flex" },

  hero: { padding: "2px 18px 12px" },
  heroLabel: { fontSize: 11, letterSpacing: 2, fontWeight: 700, color: C.accent, fontFamily: "'JetBrains Mono', monospace" },
  heroRow: { display: "flex", alignItems: "baseline", gap: 8, marginTop: 2 },
  heroNum: { fontFamily: "'Bricolage Grotesque', sans-serif", fontSize: 52, fontWeight: 800, lineHeight: 1, letterSpacing: -2, color: C.ink },
  heroUnit: { fontFamily: "'Bricolage Grotesque', sans-serif", fontSize: 22, fontWeight: 700, color: C.inkSoft },
  heroSub: { display: "flex", gap: 7, marginTop: 7, fontSize: 12.5, color: C.inkSoft, fontFamily: "'JetBrains Mono', monospace", flexWrap: "wrap" },
  dot: { opacity: 0.5 },

  seg: { display: "flex", gap: 4, margin: "0 16px", padding: 4, background: C.paperAlt, borderRadius: 12 },
  segBtn: { flex: 1, padding: "9px 0", border: "none", background: "none", borderRadius: 9, fontFamily: "'Archivo', sans-serif", fontWeight: 600, fontSize: 14, color: C.inkSoft, cursor: "pointer" },
  segOn: { background: C.card, color: C.ink, boxShadow: "0 1px 3px rgba(0,0,0,0.08)" },

  main: { flex: 1, overflowY: "auto", padding: `12px 16px calc(${SAFE_B} + 12px)`, WebkitOverflowScrolling: "touch" },

  cat: { background: C.card, borderRadius: 16, marginBottom: 12, border: `1px solid ${C.lineSoft}`, overflow: "hidden" },
  catHead: { width: "100%", display: "flex", alignItems: "center", gap: 9, padding: "12px 14px", background: "none", border: "none", borderBottom: `1px solid ${C.lineSoft}`, cursor: "pointer" },
  swatch: { width: 11, height: 11, borderRadius: 3, flexShrink: 0 },
  catName: { fontWeight: 700, fontSize: 15, flex: 1, textAlign: "left", letterSpacing: -0.2 },
  catMeta: { fontSize: 11.5, color: C.inkSoft, fontFamily: "'JetBrains Mono', monospace" },
  items: { padding: "4px 0" },
  item: { display: "flex", alignItems: "center", gap: 8, padding: "9px 14px" },
  itemMain: { flex: 1, background: "none", border: "none", textAlign: "left", cursor: "pointer", padding: 0, minWidth: 0 },
  itemTop: { display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" },
  qty: { fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: C.accent, fontWeight: 700 },
  itemName: { fontSize: 14.5, fontWeight: 500, color: C.ink },
  itemDesc: { fontSize: 12, color: C.inkSoft, marginTop: 2 },
  itemRight: { display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 1 },
  price: { fontSize: 11, color: C.inkSoft, fontFamily: "'JetBrains Mono', monospace" },
  itemWt: { fontSize: 13, fontWeight: 600, fontFamily: "'JetBrains Mono', monospace", color: C.ink },
  addItem: { display: "flex", alignItems: "center", gap: 6, width: "100%", padding: "10px 14px", background: "none", border: "none", color: C.accent, fontWeight: 600, fontSize: 13.5, cursor: "pointer", fontFamily: "'Archivo', sans-serif" },
  addCat: { display: "flex", alignItems: "center", justifyContent: "center", gap: 7, width: "100%", padding: "13px", background: "none", border: `1.5px dashed ${C.line}`, borderRadius: 14, color: C.inkSoft, fontWeight: 600, fontSize: 14, cursor: "pointer", fontFamily: "'Archivo', sans-serif" },

  tag: { fontSize: 9, fontWeight: 800, letterSpacing: 0.5, padding: "2px 5px", borderRadius: 4, fontFamily: "'JetBrains Mono', monospace" },

  // chart
  chartWrap: { display: "flex", justifyContent: "center", padding: "8px 0 4px" },
  donutCenter: { position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", pointerEvents: "none" },
  donutNum: { fontFamily: "'Bricolage Grotesque', sans-serif", fontSize: 34, fontWeight: 800, letterSpacing: -1, lineHeight: 1 },
  donutUnit: { fontSize: 11, color: C.inkSoft, fontFamily: "'JetBrains Mono', monospace", marginTop: 2 },
  legend: { background: C.card, borderRadius: 16, padding: "6px 14px", marginTop: 8, border: `1px solid ${C.lineSoft}` },
  legendRow: { display: "flex", alignItems: "center", gap: 9, padding: "8px 0" },
  legendName: { fontSize: 13, fontWeight: 500, width: 96, flexShrink: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  legendBarTrack: { flex: 1, height: 6, background: C.paperAlt, borderRadius: 4, overflow: "hidden" },
  legendBar: { display: "block", height: "100%", borderRadius: 4 },
  legendVal: { fontSize: 11.5, fontFamily: "'JetBrains Mono', monospace", color: C.inkSoft, width: 64, textAlign: "right", flexShrink: 0 },

  statBox: { background: C.card, borderRadius: 16, padding: "4px 16px", marginTop: 12, border: `1px solid ${C.lineSoft}` },
  statRow: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 0" },
  statLabel: { fontSize: 14, fontWeight: 600 },
  statHint: { fontSize: 11, color: C.inkSoft, marginTop: 1 },
  statVal: { fontFamily: "'JetBrains Mono', monospace", fontSize: 14, fontWeight: 700 },
  statStrong: {},

  empty: { display: "flex", flexDirection: "column", alignItems: "center", gap: 12, padding: "60px 20px", textAlign: "center" },
  emptyText: { color: C.inkSoft, fontSize: 14 },

  // sheets
  backdrop: { position: "fixed", inset: 0, background: "rgba(38,35,28,0.4)", zIndex: 50, display: "flex", alignItems: "flex-end", justifyContent: "center", backdropFilter: "blur(2px)" },
  sheet: { width: "100%", maxWidth: 480, background: C.paper, borderRadius: "22px 22px 0 0", maxHeight: "88vh", display: "flex", flexDirection: "column", boxShadow: "0 -8px 40px rgba(0,0,0,0.25)" },
  sheetHandle: { width: 38, height: 4, borderRadius: 4, background: C.line, margin: "8px auto 0" },
  sheetHead: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 18px 4px" },
  sheetTitle: { fontFamily: "'Bricolage Grotesque', sans-serif", fontSize: 20, fontWeight: 700, letterSpacing: -0.3, margin: 0 },
  sheetBody: { padding: `8px 18px calc(${SAFE_B} + 20px)`, overflowY: "auto" },

  fieldLabel: { display: "block", fontSize: 11.5, fontWeight: 700, letterSpacing: 0.5, color: C.inkSoft, textTransform: "uppercase", marginBottom: 6, fontFamily: "'JetBrains Mono', monospace" },
  input: { width: "100%", boxSizing: "border-box", padding: "12px 14px", fontSize: 16, border: `1.5px solid ${C.line}`, borderRadius: 11, background: C.card, color: C.ink, fontFamily: "'Archivo', sans-serif", outline: "none" },
  row3: { display: "grid", gridTemplateColumns: "0.7fr 1fr 1.4fr", gap: 9 },

  unitWrap: { display: "flex", flexWrap: "wrap", gap: 6 },
  unitBtn: { padding: "11px 13px", border: `1.5px solid ${C.line}`, borderRadius: 10, background: C.card, color: C.inkSoft, fontWeight: 600, fontSize: 13, cursor: "pointer", fontFamily: "'Archivo', sans-serif" },
  unitOn: { background: C.ink, color: C.paper, borderColor: C.ink },
  bigToggle: { flex: 1, padding: "13px 10px", border: `1.5px solid ${C.line}`, borderRadius: 11, background: C.card, color: C.inkSoft, fontWeight: 600, fontSize: 13.5, cursor: "pointer", fontFamily: "'Archivo', sans-serif" },

  toggles: { display: "flex", gap: 8, margin: "4px 0 18px" },
  toggle: { flex: 1, display: "flex", alignItems: "center", gap: 7, padding: "11px 10px", border: `1.5px solid ${C.line}`, borderRadius: 12, background: C.card, color: C.inkSoft, cursor: "pointer", fontFamily: "'Archivo', sans-serif" },
  toggleOn: { background: C.pine, color: "#fff", borderColor: C.pine },

  colorWrap: { display: "flex", flexWrap: "wrap", gap: 12, padding: "4px 2px" },
  colorDot: { width: 30, height: 30, borderRadius: 9, border: "none", cursor: "pointer" },

  primaryBtn: { width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "15px", background: C.accent, color: "#fff", border: "none", borderRadius: 13, fontWeight: 700, fontSize: 15.5, cursor: "pointer", fontFamily: "'Archivo', sans-serif", marginTop: 4 },
  deleteBtn: { width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 7, padding: "13px", background: "none", color: C.accentDeep, border: "none", fontWeight: 600, fontSize: 14, cursor: "pointer", marginTop: 6, fontFamily: "'Archivo', sans-serif" },

  listItem: { display: "flex", alignItems: "center", gap: 4, padding: "4px 6px 4px 4px", borderRadius: 12, marginBottom: 6, border: `1px solid ${C.lineSoft}`, background: C.card },
  listItemOn: { borderColor: C.accent, background: "#F7EFE3" },
  listPick: { flex: 1, display: "flex", alignItems: "center", gap: 9, padding: "10px 10px", background: "none", border: "none", cursor: "pointer", fontSize: 15, color: C.ink, textAlign: "left", fontFamily: "'Archivo', sans-serif" },
  miniBtn: { padding: 8, background: "none", border: "none", cursor: "pointer", borderRadius: 8 },

  note: { fontSize: 12.5, color: C.inkSoft, lineHeight: 1.5, marginTop: 14, padding: "12px 14px", background: C.paperAlt, borderRadius: 11 },

  aboutBox: { marginTop: 18, paddingTop: 18, borderTop: `1px solid ${C.line}` },
  aboutLabel: { fontSize: 11.5, fontWeight: 700, letterSpacing: 0.5, color: C.inkSoft, textTransform: "uppercase", marginBottom: 8, fontFamily: "'JetBrains Mono', monospace" },
  aboutText: { fontSize: 14, color: C.ink, lineHeight: 1.5, marginBottom: 12 },
  ytBtn: { display: "flex", alignItems: "center", justifyContent: "center", gap: 8, width: "100%", boxSizing: "border-box", padding: "13px", background: "#FF0000", color: "#fff", border: "none", borderRadius: 12, fontWeight: 700, fontSize: 14.5, cursor: "pointer", textDecoration: "none", fontFamily: "'Archivo', sans-serif", marginBottom: 9 },
  coffeeBtn: { display: "flex", alignItems: "center", justifyContent: "center", gap: 8, width: "100%", boxSizing: "border-box", padding: "13px", background: "#FFDD00", color: C.ink, border: "none", borderRadius: 12, fontWeight: 700, fontSize: 14.5, cursor: "pointer", textDecoration: "none", fontFamily: "'Archivo', sans-serif" },
  supportNote: { fontSize: 11.5, color: C.inkSoft, lineHeight: 1.4, marginTop: 10, textAlign: "center" },
};

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,500..800&family=Archivo:wght@400;500;600;700&family=JetBrains+Mono:wght@400;600;700&display=swap');
* { -webkit-tap-highlight-color: transparent; }
::-webkit-scrollbar { display: none; }
input { font-size: 16px; }
.bw-fade { animation: bwFade .3s ease; }
@keyframes bwFade { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }
.bw-sheet { animation: bwUp .26s cubic-bezier(.2,.8,.2,1); }
@keyframes bwUp { from { transform: translateY(100%); } to { transform: none; } }
.bw-pulse { animation: bwPulse 1.2s ease-in-out infinite; }
@keyframes bwPulse { 0%,100% { opacity: .4; transform: scale(.95);} 50% { opacity: 1; transform: scale(1.05);} }
button:active { transform: scale(0.97); }
`;

"use client";
import React, { useState, useRef, useCallback } from "react";
import api from '@/lib/api';

const ACCENT = "#00C896";
const BG = "#0D0F14";
const SURFACE = "#161A22";
const SURFACE2 = "#1E2330";
const BORDER = "#2A303E";
const TEXT = "#E8ECF4";
const MUTED = "#6B7280";

const MACRO_COLORS = { carbs: "#F59E0B", protein: "#3B82F6", fat: "#EF4444", fiber: "#10B981" };

const BADGE_MAP: Record<string, { label: string, bg: string, color: string }> = {
  "very healthy": { label: "Very Healthy", bg: "#064E3B", color: "#34D399" },
  "high protein": { label: "High Protein", bg: "#1E3A5F", color: "#60A5FA" },
  balanced: { label: "Balanced", bg: "#1F2937", color: "#D1D5DB" },
  "high carb": { label: "High Carb", bg: "#451A03", color: "#FCD34D" },
  "high fat": { label: "High Fat", bg: "#4C1D1D", color: "#FCA5A5" },
  "light meal": { label: "Light Meal", bg: "#1A2E1A", color: "#86EFAC" },
};

function MacroBar({ carbs, protein, fat, fiber }: any) {
  const total = carbs + protein + fat + fiber || 1;
  const pct = (v: number) => ((v / total) * 100).toFixed(1);
  return (
    <div style={{ marginTop: 12 }}>
      <div style={{ display: "flex", height: 10, borderRadius: 6, overflow: "hidden", gap: 2 }}>
        {(Object.entries({ carbs, protein, fat, fiber }) as [keyof typeof MACRO_COLORS, number][]).map(([k, v]) => (
          <div key={k} style={{ width: `${pct(v)}%`, background: MACRO_COLORS[k], borderRadius: 3, transition: "width 0.6s ease" }} />
        ))}
      </div>
      <div style={{ display: "flex", gap: 16, marginTop: 8, flexWrap: "wrap" }}>
        {[["Carbs", carbs, "carbs"], ["Protein", protein, "protein"], ["Fat", fat, "fat"], ["Fiber", fiber, "fiber"]].map(([label, val, key]) => (
          <div key={key as string} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: MUTED }}>
            <span style={{ width: 8, height: 8, borderRadius: 2, background: MACRO_COLORS[key as keyof typeof MACRO_COLORS], display: "inline-block" }} />
            <span style={{ color: TEXT }}>{val as React.ReactNode}g</span> {label as React.ReactNode} <span style={{ color: MUTED }}>({pct(val as number)}%)</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function MicroBar({ label, value, unit, daily }: any) {
  const pct = Math.min((value / daily) * 100, 100);
  const color = pct >= 25 ? ACCENT : pct >= 10 ? "#F59E0B" : "#6B7280";
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
        <span style={{ color: MUTED }}>{label}</span>
        <span style={{ color: TEXT }}>{value}{unit} <span style={{ color: MUTED }}>({pct.toFixed(0)}% DV)</span></span>
      </div>
      <div style={{ height: 4, background: BORDER, borderRadius: 2, overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: 2, transition: "width 0.8s ease" }} />
      </div>
    </div>
  );
}

function StatCard({ label, value, unit, highlight }: any) {
  return (
    <div style={{ background: highlight ? `linear-gradient(135deg, #003D2D, #001F17)` : SURFACE2, border: `1px solid ${highlight ? ACCENT + "40" : BORDER}`, borderRadius: 10, padding: "14px 16px", textAlign: "center" }}>
      <div style={{ fontSize: 22, fontWeight: 700, color: highlight ? ACCENT : TEXT, fontFamily: "monospace", letterSpacing: -1 }}>{value}</div>
      <div style={{ fontSize: 11, color: MUTED, marginTop: 2, textTransform: "uppercase", letterSpacing: 0.8 }}>{unit || ""} {label}</div>
    </div>
  );
}

export default function NutritionScanner() {
  const [image, setImage] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);
  const [portionMultiplier, setPortionMultiplier] = useState(1.0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback((file: File) => {
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        const rawDataUrl = e.target.result as string;
        setImage(rawDataUrl);
        setResult(null);
        setPortionMultiplier(1.0);
        setError(null);

        // Compress image using Canvas for 10x faster processing
        const img = new Image();
        img.src = rawDataUrl;
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const MAX_SIZE = 800;
          let width = img.width;
          let height = img.height;
          if (width > height) {
            if (width > MAX_SIZE) {
              height *= MAX_SIZE / width;
              width = MAX_SIZE;
            }
          } else {
            if (height > MAX_SIZE) {
              width *= MAX_SIZE / height;
              height = MAX_SIZE;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const compressedDataUrl = canvas.toDataURL("image/jpeg", 0.75);
            setImageBase64(compressedDataUrl.split(",")[1]);
          } else {
            setImageBase64(rawDataUrl.split(",")[1]);
          }
        };
      }
    };
    reader.readAsDataURL(file);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  }, [processFile]);

  const analyze = async () => {
    if (!imageBase64) return;
    setLoading(true);
    setError(null);
    try {
      const response = await api.post("/api/ai/scan-food", { imageBase64 });
      setResult(response.data.nutritionData);
      setPortionMultiplier(1.0);
    } catch (err: any) {
      if (err.response?.status === 429) {
        setError(err.response?.data?.error || err.response?.data?.message || "API Limit Reached: Please wait 60 seconds, or you may have hit the daily Free Tier limit.");
      } else {
        setError(err.response?.data?.error || err.response?.data?.message || "Could not analyze the image. Please try a clearer food photo.");
      }
    } finally {
      setLoading(false);
    }
  };

  const badge = result ? (BADGE_MAP[result.badge?.toLowerCase()] || BADGE_MAP["balanced"]) : null;

  // Calculate scaled nutrition values according to portion quantity
  const scaledCalories = Math.round((result?.calories || 0) * portionMultiplier);
  const scaledCarbs = Math.round(((result?.macros?.carbs || 0) * portionMultiplier) * 10) / 10;
  const scaledProtein = Math.round(((result?.macros?.protein || 0) * portionMultiplier) * 10) / 10;
  const scaledFat = Math.round(((result?.macros?.fat || 0) * portionMultiplier) * 10) / 10;
  const scaledFiber = Math.round(((result?.macros?.fiber || 0) * portionMultiplier) * 10) / 10;

  // Extract realistic base weight in grams (prevents "1 slice" from evaluating to 1 gram)
  const rawGramMatch = result?.servingSize?.match(/(\d+)\s*g/i);
  const parsedGramsFromServing = rawGramMatch ? parseInt(rawGramMatch[1], 10) : 0;
  const baseWeight = (result?.weightGrams && result.weightGrams >= 20)
    ? result.weightGrams
    : (parsedGramsFromServing >= 20 ? parsedGramsFromServing : 250);

  const scaledWeight = Math.round(baseWeight * portionMultiplier);

  const scaledMicros = result?.micros?.map((m: any) => ({
    ...m,
    value: Math.round(m.value * portionMultiplier * 10) / 10
  }));

  return (
    <div style={{ background: "transparent", color: TEXT, fontFamily: "'Inter', 'Segoe UI', sans-serif" }}>
      <div style={{ width: "100%", margin: "0 auto" }}>

        {/* Header */}
        <div style={{ marginBottom: 32, textAlign: "center" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 10, background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 100, padding: "6px 16px", marginBottom: 20 }}>
            <span style={{ fontSize: 16 }}>🥦</span>
            <span style={{ fontSize: 12, color: MUTED, letterSpacing: 1, textTransform: "uppercase" }}>AI Nutrition Scanner</span>
          </div>
          <h1 style={{ margin: 0, fontSize: "clamp(26px, 5vw, 40px)", fontWeight: 800, letterSpacing: -1, lineHeight: 1.1 }}>
            Snap food.{" "}
            <span style={{ color: ACCENT }}>Know exactly</span>
            <br />what you're eating.
          </h1>
          <p style={{ color: MUTED, marginTop: 12, fontSize: 15, lineHeight: 1.6 }}>
            Upload any food photo — AI identifies it and calculates the full nutritional breakdown instantly.
          </p>
        </div>

        {/* Upload Zone */}
        <div
          onClick={() => fileRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          style={{
            border: `2px dashed ${dragging ? ACCENT : image ? ACCENT + "60" : BORDER}`,
            borderRadius: 16,
            padding: image ? 0 : "40px 24px",
            cursor: "pointer",
            background: dragging ? `${ACCENT}08` : SURFACE,
            transition: "all 0.2s",
            overflow: "hidden",
            position: "relative",
            marginBottom: 16,
          }}
        >
          <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={e => { if (e.target.files) processFile(e.target.files[0]) }} />
          {image ? (
            <div style={{ position: "relative" }}>
              <img src={image} alt="Food" style={{ width: "100%", maxHeight: 320, objectFit: "cover", display: "block" }} />
              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(13,15,20,0.8) 0%, transparent 50%)" }} />
              <div style={{ position: "absolute", bottom: 14, left: 16, fontSize: 13, color: "#aaa" }}>
                📷 Click to change image
              </div>
            </div>
          ) : (
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>📸</div>
              <div style={{ color: TEXT, fontWeight: 600, marginBottom: 6 }}>Drop a food photo here</div>
              <div style={{ color: MUTED, fontSize: 13 }}>or click to browse — JPG, PNG, WEBP</div>
            </div>
          )}
        </div>

        {/* Analyze Button */}
        {image && !result && (
          <button
            onClick={analyze}
            disabled={loading}
            style={{
              width: "100%",
              padding: "15px 24px",
              background: loading ? SURFACE2 : `linear-gradient(135deg, ${ACCENT}, #00A07A)`,
              color: loading ? MUTED : "#000",
              border: "none",
              borderRadius: 12,
              fontSize: 15,
              fontWeight: 700,
              cursor: loading ? "not-allowed" : "pointer",
              letterSpacing: 0.3,
              marginBottom: 24,
              transition: "all 0.2s",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
            }}
          >
            {loading ? (
              <>
                <span style={{ display: "inline-block", width: 16, height: 16, border: "2px solid #444", borderTop: `2px solid ${ACCENT}`, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                Analyzing nutrition…
              </>
            ) : "🔍 Analyze Nutrition"}
          </button>
        )}

        {error && (
          <div style={{ background: "#2D1212", border: "1px solid #7F1D1D", borderRadius: 10, padding: "12px 16px", color: "#FCA5A5", fontSize: 14, marginBottom: 24 }}>
            ⚠️ {error}
          </div>
        )}

        {/* Results */}
        {result && (
          <div style={{ animation: "fadeIn 0.4s ease" }}>
            {/* Food name + badge */}
            <div style={{ display: "flex", justifyItems: "center", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
              <div>
                <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>{result.foodName}</h2>
                <div style={{ color: MUTED, fontSize: 13, marginTop: 3 }}>Base Portion: {result.servingSize}</div>
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                {badge && (
                  <span style={{ background: badge.bg, color: badge.color, border: `1px solid ${badge.color}30`, borderRadius: 8, padding: "4px 12px", fontSize: 12, fontWeight: 600 }}>
                    {badge.label}
                  </span>
                )}
                <div style={{ background: SURFACE2, border: `1px solid ${ACCENT}50`, borderRadius: 8, padding: "4px 12px", textAlign: "center" }}>
                  <div style={{ fontSize: 18, fontWeight: 800, color: ACCENT, fontFamily: "monospace" }}>{result.fitScore}</div>
                  <div style={{ fontSize: 10, color: MUTED, letterSpacing: 0.5 }}>FIT SCORE</div>
                </div>
              </div>
            </div>

            {/* Interactive Portion Quantity Scaler */}
            <div style={{ background: SURFACE, border: `1px solid ${ACCENT}40`, borderRadius: 12, padding: "14px 18px", marginBottom: 20 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, flexWrap: "wrap", gap: 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: TEXT }}>⚖️ Exact Quantity:</span>
                  <div style={{ display: "inline-flex", alignItems: "center", background: SURFACE2, border: `1px solid ${ACCENT}80`, borderRadius: 8, padding: "3px 10px" }}>
                    <input
                      type="number"
                      min="10"
                      max="5000"
                      value={scaledWeight}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        if (!isNaN(val) && val > 0) {
                          setPortionMultiplier(+(val / baseWeight).toFixed(3));
                        }
                      }}
                      style={{
                        width: 55,
                        background: "transparent",
                        border: "none",
                        color: ACCENT,
                        fontSize: 16,
                        fontWeight: 800,
                        fontFamily: "monospace",
                        textAlign: "right",
                        outline: "none"
                      }}
                    />
                    <span style={{ fontSize: 14, fontWeight: 700, color: ACCENT, marginLeft: 3 }}>g</span>
                  </div>
                  <span style={{ fontSize: 12, color: MUTED }}>({portionMultiplier}x)</span>
                </div>

                <div style={{ display: "flex", gap: 6 }}>
                  {[0.5, 1.0, 1.5, 2.0].map(m => (
                    <button
                      key={m}
                      onClick={() => setPortionMultiplier(m)}
                      style={{
                        background: portionMultiplier === m ? ACCENT : SURFACE2,
                        color: portionMultiplier === m ? "#000" : TEXT,
                        border: `1px solid ${portionMultiplier === m ? ACCENT : BORDER}`,
                        borderRadius: 6,
                        padding: "4px 10px",
                        fontSize: 12,
                        fontWeight: 700,
                        cursor: "pointer",
                        transition: "all 0.2s"
                      }}
                    >
                      {m}x
                    </button>
                  ))}
                </div>
              </div>
              
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <button
                  onClick={() => setPortionMultiplier(p => Math.max(0.25, +(p - 0.25).toFixed(2)))}
                  style={{ background: SURFACE2, border: `1px solid ${BORDER}`, color: TEXT, borderRadius: 6, width: 32, height: 32, fontSize: 16, fontWeight: 700, cursor: "pointer" }}
                >
                  -
                </button>
                <div style={{ flex: 1, textAlign: "center" }}>
                  <input
                    type="range"
                    min="0.25"
                    max="3.0"
                    step="0.05"
                    value={portionMultiplier}
                    onChange={(e) => setPortionMultiplier(parseFloat(e.target.value))}
                    style={{ width: "100%", accentColor: ACCENT, cursor: "pointer" }}
                  />
                </div>
                <button
                  onClick={() => setPortionMultiplier(p => +(p + 0.25).toFixed(2))}
                  style={{ background: SURFACE2, border: `1px solid ${BORDER}`, color: TEXT, borderRadius: 6, width: 32, height: 32, fontSize: 16, fontWeight: 700, cursor: "pointer" }}
                >
                  +
                </button>
              </div>
            </div>

            {/* Scaled Macro Stats */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 20 }}>
              <StatCard label="Calories" value={scaledCalories} unit="kcal" highlight />
              <StatCard label="Protein" value={`${scaledProtein}g`} />
              <StatCard label="Carbs" value={`${scaledCarbs}g`} />
              <StatCard label="Fat" value={`${scaledFat}g`} />
            </div>

            {/* Scaled Macro Bar */}
            <div style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 12, padding: "16px 18px", marginBottom: 16 }}>
              <div style={{ fontSize: 12, color: MUTED, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 4 }}>Macronutrient Breakdown ({scaledWeight}g)</div>
              <MacroBar carbs={scaledCarbs} protein={scaledProtein} fat={scaledFat} fiber={scaledFiber} />
            </div>

            {/* Scaled Micros */}
            <div style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 12, padding: "16px 18px", marginBottom: 16 }}>
              <div style={{ fontSize: 12, color: MUTED, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 14 }}>Micronutrients · % Daily Value ({scaledWeight}g)</div>
              {scaledMicros?.map((m: any, i: number) => <MicroBar key={i} {...m} />)}
            </div>

            {/* Insight */}
            <div style={{ background: `linear-gradient(135deg, #002D1E, #001510)`, border: `1px solid ${ACCENT}30`, borderRadius: 12, padding: "16px 18px" }}>
              <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                <span style={{ fontSize: 20, flexShrink: 0 }}>💡</span>
                <div>
                  <div style={{ fontSize: 12, color: ACCENT, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 6, fontWeight: 600 }}>FitCoach Insight</div>
                  <div style={{ fontSize: 14, lineHeight: 1.7, color: "#C4D4CC" }}>{result.insight}</div>
                </div>
              </div>
            </div>
            
             {/* Retake Button */}
            <button
              onClick={() => { setResult(null); setImage(null); setImageBase64(null); setError(null); }}
              style={{
                width: "100%",
                padding: "12px 24px",
                background: "transparent",
                color: TEXT,
                border: `1px solid ${BORDER}`,
                borderRadius: 12,
                fontSize: 14,
                fontWeight: 600,
                cursor: "pointer",
                marginTop: 16,
                transition: "all 0.2s",
              }}
            >
              Scan Another Item
            </button>
          </div>
        )}

        {/* Empty state hint */}
        {!image && !result && (
          <div style={{ textAlign: "center", color: MUTED, fontSize: 13, marginTop: 8 }}>
            Works best with: a single plate or dish, good lighting, clear shot from above
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}

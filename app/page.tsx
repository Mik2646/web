"use client";

import React, { useState, useEffect } from "react";
import {
  Upload,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Gift,
  Users,
} from "lucide-react";

const GOOGLE_APPS_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbwmMMqhMPWaODWlyOU4ytOmfJfttFxq0STHerr9zuyAcOaHwJEQtah6GUw4yC2qdqcq/exec";

type FilePayload = {
  name: string;
  type: string;
  data: string; // base64
};

type Winner = {
  row: number;
  timestamp: string | Date;
  name: string;
  phone: string;
  imageUrl?: string;
};

// ย่อรูป + บีบอัด แล้วแปลงเป็น base64
async function compressImageToBase64(
  file: File,
  maxSize = 1200
): Promise<FilePayload> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      const img = new window.Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > height && width > maxSize) {
          height = (height * maxSize) / width;
          width = maxSize;
        } else if (height > maxSize) {
          width = (width * maxSize) / height;
          height = maxSize;
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Cannot get canvas context"));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.7);
        const base64 = dataUrl.split(",")[1];

        resolve({
          name: file.name,
          type: "image/jpeg",
          data: base64,
        });
      };
      img.onerror = reject;
      img.src = reader.result as string;
    };

    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function RegisterPrizePage() {
  const [billFile, setBillFile] = useState<File | null>(null);
  const [billPreview, setBillPreview] = useState<string | null>(null);

  const [loading, setLoading] = useState(false); // ส่งฟอร์ม
  const [showSuccess, setShowSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // ใช้ trigger ให้ LuckyDrawPanel รีโหลดจำนวนคนลงทะเบียน
  const [refreshKey, setRefreshKey] = useState(0);

  const handleBillUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    setBillFile(file);
    setBillPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!billFile) {
      setErrorMsg("กรุณาอัปโหลดรูปถ่ายบิลก่อนส่งฟอร์มครับ");
      return;
    }

    setLoading(true);
    setShowSuccess(false);

    const form = e.currentTarget;
    const name = (form.elements.namedItem("name") as HTMLInputElement).value;
    const phone = (form.elements.namedItem("phone") as HTMLInputElement).value;

    try {
      const bill = await compressImageToBase64(billFile);

      const payload = {
        name,
        phone,
        bill,
      };

      await fetch(GOOGLE_APPS_SCRIPT_URL, {
        method: "POST",
        mode: "no-cors", // กัน CORS เวลาเรียกจากโดเมนเว็บเรา
        body: JSON.stringify(payload),
      });

      // ถ้า fetch ไม่พัง ถือว่าส่งสำเร็จ
      form.reset();
      setBillFile(null);
      setBillPreview(null);
      setShowSuccess(true);

      // ให้ LuckyDrawPanel รีเฟรชจำนวนคนลงทะเบียน
      setRefreshKey((k) => k + 1);
    } catch (err) {
      console.error(err);
      setErrorMsg("ส่งข้อมูลไม่สำเร็จ ลองใหม่อีกครั้งนะครับ");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Dialog ตอนโหลดส่งฟอร์ม */}
      {loading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl px-6 py-5 flex flex-col items-center gap-3 shadow-xl">
            <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
            <p className="text-sm font-semibold text-gray-800">
              กำลังส่งข้อมูลลงทะเบียน...
            </p>
            <p className="text-[11px] text-gray-500 text-center">
              อย่าปิดหน้านี้จนกว่าจะส่งเสร็จนะครับ
            </p>
          </div>
        </div>
      )}

      {/* Dialog ส่งสำเร็จ */}
      {showSuccess && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/30">
          <div className="bg-white rounded-2xl px-6 py-6 flex flex-col items-center gap-3 shadow-xl max-w-sm mx-3">
            <CheckCircle2 className="w-10 h-10 text-green-500" />
            <p className="text-base font-bold text-gray-900">
              ส่งข้อมูลเรียบร้อยแล้ว 🎉
            </p>
            <p className="text-xs text-gray-600 text-center">
              ขอบคุณที่ร่วมลงทะเบียนลุ้นรางวัล
            </p>
            <button
              className="mt-2 px-4 py-2 rounded-full bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs font-semibold shadow hover:brightness-110"
              onClick={() => setShowSuccess(false)}
            >
              ปิดหน้าต่าง
            </button>
          </div>
        </div>
      )}

      {/* Dialog error จากฝั่งฟอร์ม */}
      {errorMsg && !loading && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/30">
          <div className="bg-white rounded-2xl px-6 py-6 flex flex-col items-center gap-3 shadow-xl max-w-sm mx-3">
            <AlertCircle className="w-8 h-8 text-red-500" />
            <p className="text-sm font-bold text-gray-900">มีข้อผิดพลาด</p>
            <p className="text-xs text-gray-600 text-center">{errorMsg}</p>
            <button
              className="mt-2 px-4 py-2 rounded-full bg-gray-800 text-white text-xs font-semibold hover:bg-gray-900"
              onClick={() => setErrorMsg(null)}
            >
              ปิด
            </button>
          </div>
        </div>
      )}

      {/* เนื้อหาหลัก + คอมโพเนนต์สุ่มด้านล่าง */}
      <div className="min-h-screen bg-orange-50 flex justify-center px-4 py-10">
        <div className="w-full max-w-md space-y-4">
          {/* การ์ดฟอร์มลงทะเบียน */}
          <p className="text-xl font-black  justify-center flex items-center text-orange-500">
                  ส.เจริญหลังคาเหล็กทุกบิลลุ้นรางวัล
                </p>
          <div className="bg-white rounded-3xl shadow-xl border border-orange-100 p-6 space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-orange-500">
                  กิจกรรมลุ้นรางวัล
                </p>
                <p className="text-lg font-black text-gray-900">
                  ลงทะเบียนรับสิทธิ์
                </p>
              </div>
              <div className="text-[11px] px-3 py-1 rounded-full bg-orange-100 text-orange-700 font-semibold">
                ง่าย ๆ แค่กรอกและอัปโหลดบิล
              </div>
            </div>

            <p className="text-[11px] text-gray-600">
              กรอกชื่อ เบอร์โทร และอัปโหลดรูปถ่ายบิลซื้อสินค้าของคุณให้ครบ
              เพื่อร่วมลุ้นรางวัลจากเรา
            </p>

            <form onSubmit={handleSubmit} className="space-y-4 mt-2">
              {/* ชื่อ */}
              <div>
                <label className="block text-xs font-semibold text-gray-800 mb-1">
                  ชื่อ–นามสกุล <span className="text-red-500">*</span>
                </label>
                <input
                  name="name"
                  required
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:bg-white"
                  placeholder="เช่น อภิสรา จันทวิเศษ"
                />
              </div>

              {/* เบอร์โทร */}
              <div>
                <label className="block text-xs font-semibold text-gray-800 mb-1">
                  เบอร์โทรศัพท์ <span className="text-red-500">*</span>
                </label>
                <input
                  name="phone"
                  type="tel"
                  pattern="[0-9]{9,10}"
                  required
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:bg-white"
                  placeholder="เช่น 0812345678"
                />
                <p className="text-[10px] text-gray-400 mt-1">
                  กรุณากรอกเฉพาะตัวเลข 9–10 หลัก
                </p>
              </div>

              {/* รูปบิล */}
              <div>
                <label className="block text-xs font-semibold text-gray-800 mb-1">
                  รูปถ่ายบิล / ใบเสร็จ{" "}
                  <span className="text-red-500">*</span>
                </label>

                <label className="border border-dashed border-orange-300 bg-orange-50/60 rounded-xl px-3 py-3 flex items-center gap-3 cursor-pointer hover:bg-orange-100">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-orange-300 to-orange-500 flex items-center justify-center">
                    <Upload className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-gray-800">
                      เลือกรูปถ่ายบิลของคุณ
                    </p>
                    <p className="text-[10px] text-gray-500">
                      รองรับไฟล์ .jpg, .jpeg, .png ขนาดไม่ใหญ่เกินไป
                    </p>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleBillUpload}
                  />
                </label>

                {billPreview && (
                  <div className="mt-2">
                    <p className="text-[10px] text-gray-500 mb-1">
                      พรีวิวรูปบิล:
                    </p>
                    <img
                      src={billPreview}
                      alt="bill preview"
                      className="w-28 h-28 object-cover rounded-lg border border-orange-200"
                    />
                  </div>
                )}
              </div>

              {/* ปุ่มส่ง */}
              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 bg-gradient-to-r from-orange-500 to-red-500 text-white font-black text-sm px-4 py-3 rounded-2xl shadow hover:brightness-110 transition disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? "กำลังส่งข้อมูล..." : "ส่งข้อมูลลงทะเบียน"}
              </button>
            </form>

            <p className="text-[10px] text-gray-500 text-center mt-2">
              ข้อมูลนี้ใช้สำหรับติดต่อกลับและบันทึกในระบบกิจกรรมเท่านั้น
            </p>
          </div>

          {/* คอมโพเนนต์สุ่มรางวัลด้านล่าง */}
          <LuckyDrawPanel refreshKey={refreshKey} />
        </div>
      </div>
    </>
  );
}

/**
 * คอมโพเนนต์ LuckyDrawPanel:
 * - โชว์จำนวนคนลงทะเบียน
 * - ปุ่มสุ่มรางวัล (มีเอฟเฟกต์หมุน)
 * - แสดงข้อมูลผู้โชคดี
 */
function LuckyDrawPanel({ refreshKey }: { refreshKey: number }) {
  const [totalRegistered, setTotalRegistered] = useState<number | null>(null);
  const [loadingCount, setLoadingCount] = useState(false);
  const [loadingDraw, setLoadingDraw] = useState(false);
  const [winner, setWinner] = useState<Winner | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCount();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey]);

  const fetchCount = async () => {
    try {
      setLoadingCount(true);
      const res = await fetch(`${GOOGLE_APPS_SCRIPT_URL}?action=count`);
      const data = await res.json();
      if (data.success) {
        setTotalRegistered(data.count ?? 0);
      } else {
        setTotalRegistered(0);
      }
    } catch (err) {
      console.error(err);
      setTotalRegistered(null);
    } finally {
      setLoadingCount(false);
    }
  };

  const handleDrawWinner = async () => {
    setError(null);
    setWinner(null);
    setLoadingDraw(true);
    try {
      const res = await fetch(`${GOOGLE_APPS_SCRIPT_URL}?action=random`);
      const data = await res.json();
      if (!data.success) {
        setError(data.message || "ยังไม่มีข้อมูลสำหรับสุ่มรางวัล");
        return;
      }
      setWinner(data.winner as Winner);
    } catch (err) {
      console.error(err);
      setError("สุ่มรางวัลไม่สำเร็จ ลองใหม่อีกครั้งนะครับ");
    } finally {
      setLoadingDraw(false);
    }
  };

  const disabledDraw = loadingDraw || !totalRegistered || totalRegistered <= 0;

  return (
    <div className="bg-white rounded-3xl shadow-md border border-orange-100 p-5 space-y-4">
      {/* แถบบน */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold text-orange-500 flex items-center gap-1">
            <Gift className="w-3.5 h-3.5" />
            แผงจัดการลุ้นรางวัล
          </p>
          <p className="text-[11px] text-gray-500">
            สำหรับเจ้าของกิจกรรม / แอดมินดูผลแบบง่าย ๆ
          </p>
        </div>
        <div className="flex flex-col items-end">
          <div className="flex items-center gap-1.5 text-[11px] px-3 py-1 rounded-full bg-orange-50 text-orange-700 font-semibold">
            <Users className="w-3.5 h-3.5" />
            {loadingCount
              ? "กำลังโหลด..."
              : `ลงทะเบียนแล้ว ${totalRegistered ?? 0} คน`}
          </div>
        </div>
      </div>

      {/* วงหมุน + ปุ่มสุ่ม */}
      <div className="flex items-center gap-4">
        {/* วงกลมหมุนตอนสุ่ม */}
        <div className="flex-0">
          <div className="w-24 h-24 md:w-28 md:h-28 rounded-full bg-gradient-to-br from-orange-100 via-orange-50 to-white border-2 border-dashed border-orange-300 flex items-center justify-center shadow-inner relative overflow-hidden">
            <div
              className={`w-16 h-16 rounded-full bg-gradient-to-br from-orange-400 to-red-400 flex items-center justify-center shadow-lg ${
                loadingDraw ? "animate-spin" : ""
              }`}
            >
              <Gift className="w-8 h-8 text-white" />
            </div>
            <div className="absolute top-1/2 -right-1 w-3 h-3 rounded-full bg-orange-500 shadow" />
          </div>
        </div>

        {/* ปุ่ม + ข้อความ */}
        <div className="flex-1 space-y-2">
          <p className="text-xs font-semibold text-gray-800">
            กดเพื่อสุ่มผู้โชคดีจากรายชื่อทั้งหมด
          </p>
          <button
            type="button"
            disabled={disabledDraw}
            onClick={handleDrawWinner}
            className="inline-flex items-center justify-center gap-2 w-full text-xs font-semibold px-3 py-2 rounded-2xl bg-gradient-to-r from-orange-500 to-red-500 text-white shadow hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loadingDraw ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                กำลังสุ่มหาผู้โชคดี...
              </>
            ) : (
              <>
                <Gift className="w-4 h-4" />
                สุ่มรางวัลตอนนี้
              </>
            )}
          </button>
          <p className="text-[10px] text-gray-400">
            * ทุกชื่อที่ลงทะเบียน (มีชื่อ+เบอร์) จะมีสิทธิ์ลุ้นเท่ากันทุกคน
          </p>
        </div>
      </div>

      {/* แสดงผู้โชคดี */}
      {winner && (
        <div className="mt-2 border border-orange-100 rounded-2xl p-3 bg-orange-50/70 space-y-1">
          <p className="text-xs font-bold text-orange-700">
            🎉 ผู้โชคดีที่สุ่มได้
          </p>
          <p className="text-sm font-semibold text-gray-900">{winner.name}</p>
          <p className="text-xs text-gray-700">เบอร์: {winner.phone}</p>
          {winner.imageUrl && (
            <div className="mt-1">
              <p className="text-[10px] text-gray-500 mb-0.5">
                รูปบิลที่ใช้ร่วมลุ้นรางวัล:
              </p>
              <a
                href={winner.imageUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex text-[11px] text-orange-700 underline"
              >
                เปิดดูรูปบิลใน Google Drive
              </a>
            </div>
          )}
        </div>
      )}

      {/* error เฉพาะส่วนสุ่ม */}
      {error && (
        <p className="text-[11px] text-red-500 mt-1 text-right">{error}</p>
      )}
    </div>
  );
}

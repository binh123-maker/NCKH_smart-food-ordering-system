import React from "react";
import { Link } from "react-router-dom";
import { Sparkles, Heart } from "lucide-react";

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-900 text-slate-400 text-xs border-t border-slate-800 mt-20">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand Col */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-white">
              <div className="h-8 w-8 rounded-lg bg-primary text-white flex items-center justify-center font-bold">
                <Sparkles className="h-4 w-4" />
              </div>
              <span className="font-extrabold text-base tracking-tight">
                Food<span className="text-primary">RecSys</span>
              </span>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed">
              Hệ thống đặt đồ ăn trực tuyến tích hợp gợi ý món ăn thông minh dựa trên khẩu vị, lịch sử đặt và chỉ số dinh dưỡng.
            </p>
            <p className="text-[11px] text-slate-500">
              Đề tài Nghiên cứu Khoa học Sinh viên - Chuyên ngành Kỹ thuật Phần mềm & Trí tuệ Nhân tạo.
            </p>
          </div>

          {/* Quick links */}
          <div>
            <h4 className="text-white font-bold mb-3 text-xs uppercase tracking-wider">Khám phá</h4>
            <ul className="space-y-2">
              <li><Link to="/foods" className="hover:text-white transition-colors">Thực đơn phong phú</Link></li>
              <li><Link to="/restaurants" className="hover:text-white transition-colors">Nhà hàng uy tín</Link></li>
              <li><Link to="/recommendations" className="hover:text-white transition-colors">Món ăn gợi ý hôm nay</Link></li>
              <li><Link to="/search" className="hover:text-white transition-colors">Tìm kiếm theo dinh dưỡng</Link></li>
            </ul>
          </div>

          {/* AI Info */}
          <div>
            <h4 className="text-white font-bold mb-3 text-xs uppercase tracking-wider">Công nghệ RecSys</h4>
            <ul className="space-y-2">
              <li>Content-Based (TF-IDF & Macro Nutrition)</li>
              <li>Collaborative Filtering (SVD / Matrix Factorization)</li>
              <li>Hybrid Recommendation Architecture</li>
              <li>Cold Start Handling Strategy</li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-white font-bold mb-3 text-xs uppercase tracking-wider">Thông tin liên hệ</h4>
            <p className="leading-relaxed mb-2">Trường Đại học Khoa học Tự nhiên - ĐHQG-HCM</p>
            <p className="leading-relaxed">Email hỗ trợ: nckh.foodrecsys@gmail.com</p>
          </div>
        </div>

        <div className="pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
          <p>© 2026 FoodRecSys Research Project. Toàn bộ mã nguồn phục vụ học thuật.</p>
          <div className="flex items-center gap-1">
            <span>Xây dựng với</span>
            <Heart className="h-3 w-3 text-red-500 fill-red-500" />
            <span>bởi Nhóm Nghiên cứu Khoa học</span>
          </div>
        </div>
      </div>
    </footer>
  );
};


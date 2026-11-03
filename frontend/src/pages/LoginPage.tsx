import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Sparkles, Mail, Lock } from "lucide-react";
import { Input } from "../components/ui/Input";
import { Button } from "../components/ui/Button";
import { useAuthStore } from "../stores/authStore";
import { authService } from "../services/authService";

const loginSchema = z.object({
  email: z.string().email("Vui lòng nhập địa chỉ email hợp lệ"),
  password: z.string().min(6, "Mật khẩu phải có ít nhất 6 ký tự"),
});

type LoginFormData = z.infer<typeof loginSchema>;

export const LoginPage: React.FC = () => {
  const { login } = useAuthStore();
  const navigate = useNavigate();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "customer@example.com",
      password: "Customer@123456",
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setErrorMsg(null);
    try {
      const tokens = await authService.login(data);
      localStorage.setItem("access_token", tokens.access_token);
      localStorage.setItem("refresh_token", tokens.refresh_token);
      const user = await authService.getMe();
      login(user, tokens.access_token, tokens.refresh_token);

      if (user.role === "ADMIN") {
        navigate("/admin/dashboard");
      } else {
        navigate("/");
      }
    } catch (err: any) {
      const message =
        err.response?.data?.message ||
        err.response?.data?.error?.message ||
        (typeof err.response?.data?.error?.details === "string"
          ? err.response?.data?.error?.details
          : null) ||
        "Đăng nhập không thành công. Vui lòng kiểm tra lại thông tin.";
      setErrorMsg(message);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <div className="w-full max-w-4xl bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden grid grid-cols-1 md:grid-cols-2">
        {/* Left Side: Brand & Visual */}
        <div className="bg-gradient-to-br from-orange-500 to-amber-500 p-8 text-white flex flex-col justify-between hidden md:flex">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-white/20 flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <span className="font-extrabold text-base tracking-tight">FoodRecSys</span>
          </div>

          <div className="space-y-4 my-auto">
            <h2 className="text-2xl font-black leading-snug">
              Trải nghiệm đặt món ăn cá nhân hóa bằng AI
            </h2>
            <p className="text-xs text-orange-100 leading-relaxed">
              Không còn lo lắng "Hôm nay ăn gì?". Thuật toán gợi ý thông minh sẽ tự động lựa chọn thực đơn hoàn hảo theo khẩu vị của bạn.
            </p>
          </div>

          <p className="text-[11px] text-orange-200">© 2026 Đề tài Nghiên cứu Khoa học</p>
        </div>

        {/* Right Side: Form */}
        <div className="p-8 sm:p-10 flex flex-col justify-center">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-slate-800">Đăng nhập tài khoản</h2>
            <p className="text-xs text-slate-500 mt-1">Chào mừng bạn quay trở lại với FoodRecSys!</p>
          </div>

          {errorMsg && (
            <div className="mb-4 p-3 rounded-xl bg-red-50 text-red-600 text-xs font-medium border border-red-100">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="Địa chỉ Email"
              type="email"
              placeholder="tenban@example.com"
              icon={<Mail className="h-4 w-4" />}
              error={errors.email?.message}
              {...register("email")}
            />

            <Input
              label="Mật khẩu"
              type="password"
              placeholder="••••••••"
              icon={<Lock className="h-4 w-4" />}
              error={errors.password?.message}
              {...register("password")}
            />

            <div className="flex items-center justify-between text-xs">
              <label className="flex items-center gap-1.5 text-slate-600 cursor-pointer">
                <input type="checkbox" className="rounded text-primary focus:ring-primary" defaultChecked />
                <span>Ghi nhớ đăng nhập</span>
              </label>
              <a href="#forgot" className="text-primary hover:underline font-medium">
                Quên mật khẩu?
              </a>
            </div>

            <Button type="submit" isLoading={isSubmitting} className="w-full" size="lg">
              Đăng nhập ngay
            </Button>
          </form>

          {/* Quick Demo Fillers */}
          <div className="mt-4 pt-4 border-t border-slate-100 space-y-2">
            <span className="text-[10px] uppercase font-bold text-slate-400">Tài khoản demo sẵn có:</span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setValue("email", "customer@example.com", { shouldValidate: true, shouldDirty: true });
                  setValue("password", "Customer@123456", { shouldValidate: true, shouldDirty: true });
                  setErrorMsg(null);
                }}
                className="py-1.5 px-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold text-center transition-colors"
              >
                👤 Khách hàng
              </button>
              <button
                type="button"
                onClick={() => {
                  setValue("email", "admin@foodrecsys.com", { shouldValidate: true, shouldDirty: true });
                  setValue("password", "Admin@123456", { shouldValidate: true, shouldDirty: true });
                  setErrorMsg(null);
                }}
                className="py-1.5 px-2 rounded-lg bg-orange-100 hover:bg-orange-200 text-orange-800 text-[11px] font-semibold text-center transition-colors"
              >
                ⚡ Quản trị viên
              </button>
            </div>
          </div>

          <p className="text-center text-xs text-slate-500 mt-6">
            Chưa có tài khoản?{" "}
            <Link to="/register" className="text-primary font-bold hover:underline">
              Đăng ký tại đây
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};


import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Sparkles, Mail, Lock } from "lucide-react";
import { Input } from "../components/ui/Input";
import { Button } from "../components/ui/Button";
import { useAuthStore } from "../stores/authStore";

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
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "nguyenvana@gmail.com",
      password: "password123",
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setErrorMsg(null);
    try {
      // Mock login for frontend phase
      login(
        {
          id: "usr-demo",
          email: data.email,
          full_name: "Nguyễn Văn A",
          role: "CUSTOMER",
          is_active: true,
          is_onboarded: true,
          avatar_url: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80",
        },
        "mock-jwt-token-for-dev"
      );
      navigate("/");
    } catch (err: unknown) {
      setErrorMsg("Đăng nhập không thành công. Vui lòng kiểm tra lại thông tin.");
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


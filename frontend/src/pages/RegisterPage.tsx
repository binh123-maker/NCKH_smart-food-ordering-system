import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Sparkles, Mail, Lock, User as UserIcon, Phone, Check, ArrowRight } from "lucide-react";
import { Input } from "../components/ui/Input";
import { Button } from "../components/ui/Button";
import { useAuthStore } from "../stores/authStore";
import { MOCK_CATEGORIES } from "../data/mockData";

const registerSchema = z.object({
  fullName: z.string().min(2, "Họ và tên tối thiểu 2 ký tự"),
  email: z.string().email("Vui lòng nhập địa chỉ email hợp lệ"),
  phone: z.string().min(9, "Số điện thoại không hợp lệ"),
  password: z.string().min(6, "Mật khẩu tối thiểu 6 ký tự"),
  confirmPassword: z.string().min(6, "Xác nhận mật khẩu"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Mật khẩu xác nhận không khớp",
  path: ["confirmPassword"],
});

type RegisterFormData = z.infer<typeof registerSchema>;

export const RegisterPage: React.FC = () => {
  const { login } = useAuthStore();
  const navigate = useNavigate();
  const [step, setStep] = useState<1 | 2>(1);
  const [basicData, setBasicData] = useState<RegisterFormData | null>(null);

  // Step 2 Onboarding state
  const [selectedCats, setSelectedCats] = useState<string[]>(["cat-1", "cat-3"]);
  const [budget, setBudget] = useState<number>(50000);
  const [calorieTarget, setCalorieTarget] = useState<number>(2000);
  const [dietaryGoals, setDietaryGoals] = useState<string[]>(["HIGH_PROTEIN"]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const onStep1Submit = (data: RegisterFormData) => {
    setBasicData(data);
    setStep(2); // Go to Cold Start Survey
  };

  const toggleCategory = (catId: string) => {
    setSelectedCats((prev) =>
      prev.includes(catId) ? prev.filter((id) => id !== catId) : [...prev, catId]
    );
  };

  const toggleGoal = (goal: string) => {
    setDietaryGoals((prev) =>
      prev.includes(goal) ? prev.filter((g) => g !== goal) : [...prev, goal]
    );
  };

  const handleFinishOnboarding = () => {
    if (!basicData) return;
    // Log user in with completed onboarding
    login(
      {
        id: `usr-${Date.now()}`,
        email: basicData.email,
        full_name: basicData.fullName,
        phone: basicData.phone,
        role: "CUSTOMER",
        is_active: true,
        is_onboarded: true,
      },
      "mock-jwt-token-registered"
    );
    navigate("/");
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-white rounded-3xl shadow-xl border border-slate-100 p-8 sm:p-10">
        {/* Step Indicator */}
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold ${step >= 1 ? "bg-primary text-white" : "bg-slate-100 text-slate-400"}`}>
              1
            </div>
            <span className={`text-xs font-bold ${step === 1 ? "text-slate-800" : "text-slate-400"}`}>
              Thông tin tài khoản
            </span>
          </div>

          <div className="h-0.5 w-12 bg-slate-200" />

          <div className="flex items-center gap-3">
            <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold ${step === 2 ? "bg-violet-600 text-white" : "bg-slate-100 text-slate-400"}`}>
              2
            </div>
            <span className={`text-xs font-bold ${step === 2 ? "text-violet-700" : "text-slate-400"}`}>
              Khảo sát sở thích (Cold Start)
            </span>
          </div>
        </div>

        {/* STEP 1: BASIC REGISTRATION */}
        {step === 1 && (
          <form onSubmit={handleSubmit(onStep1Submit)} className="space-y-4">
            <div className="mb-4">
              <h2 className="text-xl font-bold text-slate-800">Tạo tài khoản mới</h2>
              <p className="text-xs text-slate-500 mt-1">Gia nhập cộng đồng trải nghiệm ẩm thực thông minh</p>
            </div>

            <Input
              label="Họ và tên"
              placeholder="Nguyễn Văn A"
              icon={<UserIcon className="h-4 w-4" />}
              error={errors.fullName?.message}
              {...register("fullName")}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Địa chỉ Email"
                type="email"
                placeholder="tenban@example.com"
                icon={<Mail className="h-4 w-4" />}
                error={errors.email?.message}
                {...register("email")}
              />
              <Input
                label="Số điện thoại"
                placeholder="0912345678"
                icon={<Phone className="h-4 w-4" />}
                error={errors.phone?.message}
                {...register("phone")}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Mật khẩu"
                type="password"
                placeholder="••••••••"
                icon={<Lock className="h-4 w-4" />}
                error={errors.password?.message}
                {...register("password")}
              />
              <Input
                label="Xác nhận mật khẩu"
                type="password"
                placeholder="••••••••"
                icon={<Lock className="h-4 w-4" />}
                error={errors.confirmPassword?.message}
                {...register("confirmPassword")}
              />
            </div>

            <Button type="submit" isLoading={isSubmitting} className="w-full mt-4" size="lg">
              <span>Tiếp tục: Khảo sát gu ẩm thực</span>
              <ArrowRight className="h-4 w-4" />
            </Button>

            <p className="text-center text-xs text-slate-500 pt-2">
              Đã có tài khoản?{" "}
              <Link to="/login" className="text-primary font-bold hover:underline">
                Đăng nhập tại đây
              </Link>
            </p>
          </form>
        )}

        {/* STEP 2: COLD START ONBOARDING SURVEY */}
        {step === 2 && (
          <div className="space-y-6 animate-in fade-in">
            <div className="bg-violet-50 p-4 rounded-2xl border border-violet-100 flex items-start gap-3">
              <Sparkles className="h-5 w-5 text-violet-600 shrink-0 mt-0.5" />
              <div>
                <h3 className="text-xs font-bold text-violet-900">Giải quyết bài toán Khởi đầu lạnh (Cold Start)</h3>
                <p className="text-[11px] text-violet-700 leading-relaxed mt-0.5">
                  Vì bạn là người dùng mới, hệ thống AI cần các tín hiệu ban đầu để xây dựng vector sở thích và đề xuất món ăn phù hợp nhất.
                </p>
              </div>
            </div>

            {/* Question 1: Preferred Categories */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-2">
                1. Chọn các thể loại ẩm thực bạn yêu thích (Chọn ít nhất 1):
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {MOCK_CATEGORIES.map((c) => {
                  const isSelected = selectedCats.includes(c.id);
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => toggleCategory(c.id)}
                      className={`p-3 rounded-xl border text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                        isSelected
                          ? "bg-violet-600 text-white border-violet-600 shadow-sm"
                          : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      <span>{c.icon_url}</span>
                      <span className="truncate">{c.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Question 2: Budget */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-bold text-slate-700">2. Ngân sách trung bình cho một bữa ăn:</label>
                <span className="text-xs font-extrabold text-primary">{budget.toLocaleString("vi-VN")} đ</span>
              </div>
              <input
                type="range"
                min="25000"
                max="150000"
                step="5000"
                value={budget}
                onChange={(e) => setBudget(Number(e.target.value))}
                className="w-full accent-primary cursor-pointer"
              />
            </div>

            {/* Question 3: Nutrition Goal */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-2">3. Mục tiêu dinh dưỡng chính:</label>
              <div className="flex flex-wrap gap-2">
                {[
                  { id: "HIGH_PROTEIN", label: "🥩 Tăng cơ (High Protein)" },
                  { id: "LOW_CALORIE", label: "🥗 Giảm cân (Low Calorie)" },
                  { id: "VEGETARIAN", label: "🥑 Ăn chay thanh tịnh" },
                  { id: "BALANCED", label: "🍱 Cân bằng, đầy đủ chất" },
                ].map((goal) => {
                  const isSel = dietaryGoals.includes(goal.id);
                  return (
                    <button
                      key={goal.id}
                      type="button"
                      onClick={() => toggleGoal(goal.id)}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-pointer ${
                        isSel
                          ? "bg-emerald-600 text-white border-emerald-600"
                          : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      {goal.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => handleFinishOnboarding()}
              >
                Bỏ qua (Để sau)
              </Button>
              <Button
                variant="ai"
                className="flex-1"
                onClick={handleFinishOnboarding}
              >
                <span>Hoàn tất & Nhận gợi ý</span>
                <Check className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};


/**
 * ProfileTab Component
 * Displays user profile information
 */

export default function ProfileTab({ user }) {
    if (!user) {
        return (
            <div className="text-center py-16">
                <p className="text-[#6B7280]">Không tìm thấy thông tin người dùng.</p>
            </div>
        );
    }

    return (
        <div className="space-y-5">
            <div className="bg-gradient-to-br from-[#FFF7E6] to-[#F8F4EC] rounded-[24px] border border-[#E4D8C3] p-6">
                <h3 className="heading-font text-[18px] text-[#1B4332] font-semibold mb-4 flex items-center gap-2">
                    <span>👤</span>
                    <span>Thông tin cá nhân</span>
                </h3>
                <div className="space-y-4">
                    <div className="flex items-start gap-3">
                        <span className="text-[#9CA3AF] text-[13px] font-medium min-w-[100px]">Tên:</span>
                        <span className="text-[#1B4332] text-[14px] font-semibold">{user.name || user.fullName || "—"}</span>
                    </div>
                    <div className="flex items-start gap-3">
                        <span className="text-[#9CA3AF] text-[13px] font-medium min-w-[100px]">Điện thoại:</span>
                        <span className="text-[#4B5563] text-[14px]">{user.phone || "—"}</span>
                    </div>
                    <div className="flex items-start gap-3">
                        <span className="text-[#9CA3AF] text-[13px] font-medium min-w-[100px]">Email:</span>
                        <span className="text-[#4B5563] text-[14px]">{user.email || "—"}</span>
                    </div>
                    <div className="flex items-start gap-3">
                        <span className="text-[#9CA3AF] text-[13px] font-medium min-w-[100px]">Địa chỉ:</span>
                        <span className="text-[#4B5563] text-[14px]">{user.address || "—"}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

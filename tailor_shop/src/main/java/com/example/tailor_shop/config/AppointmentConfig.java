package com.example.tailor_shop.config;

import com.example.tailor_shop.modules.appointment.domain.AppointmentType;
import java.util.List;
import java.util.Map;

public class AppointmentConfig {

    public static final int BUFFER_MINUTES = 15;

    public static final Map<AppointmentType, Integer> TYPE_DURATIONS = Map.of(
            AppointmentType.measurement, 40,
            AppointmentType.fitting, 30,
            AppointmentType.pickup, 15,
            AppointmentType.consult, 20);

    public static final Map<AppointmentType, List<String>> TYPE_CHECKLISTS = Map.of(
            AppointmentType.measurement, List.of(
                    "Dụng cụ đo (thước dây, thước vuông)",
                    "Form đo số đo",
                    "Catalog mẫu",
                    "Bảng giá"),
            AppointmentType.fitting, List.of(
                    "Đồ đã may sơ bộ",
                    "Kim chỉ sửa",
                    "Gương thử",
                    "Ghim đánh dấu"),
            AppointmentType.pickup, List.of(
                    "Đơn hàng đã hoàn thành",
                    "Túi đựng",
                    "Hóa đơn"),
            AppointmentType.consult, List.of(
                    "Catalog mẫu",
                    "Mẫu vải",
                    "Bảng giá",
                    "Portfolio"));
}

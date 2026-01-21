/**
 * Fashion Categories Constants - EXPANDED 100+ Types
 * Định nghĩa tất cả các loại thời trang với xu hướng hiện đại 2024-2025
 */

// === CATEGORY (Phân loại chính) ===
export const CATEGORY_OPTIONS = [
    { value: '', label: 'Tất cả' },
    { value: 'template', label: '📷 Mẫu trang phục' },
    { value: 'fabric', label: '🧵 Vải' },
    { value: 'style', label: '✨ Phong cách' },
];

// === TYPE (Loại trang phục chi tiết - 100+ types) ===
export const TYPE_OPTIONS = {
    // Tất cả
    all: { value: '', label: 'Tất cả loại', icon: '🏷️' },

    // ===== ÁO (TOPS) - 20+ types =====
    ao_so_mi: { value: 'ao_so_mi', label: 'Áo sơ mi', icon: '👔', group: 'tops' },
    ao_so_mi_oversize: { value: 'ao_so_mi_oversize', label: 'Áo sơ mi oversize', icon: '👔', group: 'tops' },
    ao_so_mi_croptop: { value: 'ao_so_mi_croptop', label: 'Sơ mi crop', icon: '👔', group: 'tops' },
    ao_thun: { value: 'ao_thun', label: 'Áo thun', icon: '👕', group: 'tops' },
    ao_thun_basic: { value: 'ao_thun_basic', label: 'Áo thun basic', icon: '👕', group: 'tops' },
    ao_thun_graphic: { value: 'ao_thun_graphic', label: 'Áo thun graphic', icon: '👕', group: 'tops' },
    ao_polo: { value: 'ao_polo', label: 'Áo polo', icon: '👕', group: 'tops' },
    ao_len: { value: 'ao_len', label: 'Áo len', icon: '🧶', group: 'tops' },
    ao_len_co_lo: { value: 'ao_len_co_lo', label: 'Áo len cổ lọ', icon: '🧶', group: 'tops' },
    ao_hoodie: { value: 'ao_hoodie', label: 'Áo hoodie', icon: '🧥', group: 'tops' },
    ao_croptop: { value: 'ao_croptop', label: 'Áo crop top', icon: '👚', group: 'tops' },
    ao_kiem: { value: 'ao_kiem', label: 'Áo kiểu', icon: '👚', group: 'tops' },
    ao_ba_lo: { value: 'ao_ba_lo', label: 'Áo ba lỗ / Tank top', icon: '🎽', group: 'tops' },
    ao_hai_day: { value: 'ao_hai_day', label: 'Áo hai dây', icon: '👙', group: 'tops' },
    ao_tube_top: { value: 'ao_tube_top', label: 'Tube top / Áo ống', icon: '👙', group: 'tops' },
    ao_corset: { value: 'ao_corset', label: 'Corset top', icon: '🩱', group: 'tops' },
    ao_peplum: { value: 'ao_peplum', label: 'Áo peplum', icon: '👚', group: 'tops' },
    ao_wrap: { value: 'ao_wrap', label: 'Áo wrap / Đắp chéo', icon: '👚', group: 'tops' },
    ao_off_shoulder: { value: 'ao_off_shoulder', label: 'Áo trễ vai', icon: '👚', group: 'tops' },
    ao_one_shoulder: { value: 'ao_one_shoulder', label: 'Áo lệch vai', icon: '👚', group: 'tops' },
    ao_babydoll: { value: 'ao_babydoll', label: 'Áo babydoll', icon: '👚', group: 'tops' },
    ao_bodysuit: { value: 'ao_bodysuit', label: 'Bodysuit', icon: '🩱', group: 'tops' },
    ao_bra_top: { value: 'ao_bra_top', label: 'Bra top', icon: '👙', group: 'tops' },

    // ===== ÁO KHOÁC (OUTERWEAR) - 15+ types =====
    ao_khoac: { value: 'ao_khoac', label: 'Áo khoác', icon: '🧥', group: 'outerwear' },
    ao_khoac_bomber: { value: 'ao_khoac_bomber', label: 'Bomber jacket', icon: '🧥', group: 'outerwear' },
    ao_khoac_da: { value: 'ao_khoac_da', label: 'Áo khoác da', icon: '🧥', group: 'outerwear' },
    ao_khoac_jean: { value: 'ao_khoac_jean', label: 'Áo khoác jeans', icon: '🧥', group: 'outerwear' },
    ao_khoac_parka: { value: 'ao_khoac_parka', label: 'Áo parka', icon: '🧥', group: 'outerwear' },
    ao_khoac_trench: { value: 'ao_khoac_trench', label: 'Trench coat', icon: '🧥', group: 'outerwear' },
    ao_khoac_long: { value: 'ao_khoac_long', label: 'Long coat', icon: '🧥', group: 'outerwear' },
    ao_khoac_mong: { value: 'ao_khoac_mong', label: 'Áo choàng mỏng', icon: '🧥', group: 'outerwear' },
    blazer: { value: 'blazer', label: 'Blazer', icon: '🧥', group: 'outerwear' },
    blazer_oversize: { value: 'blazer_oversize', label: 'Blazer oversize', icon: '🧥', group: 'outerwear' },
    blazer_crop: { value: 'blazer_crop', label: 'Blazer crop', icon: '🧥', group: 'outerwear' },
    vest: { value: 'vest', label: 'Vest / Gile', icon: '🤵', group: 'outerwear' },
    cardigan: { value: 'cardigan', label: 'Cardigan', icon: '🧥', group: 'outerwear' },
    ao_cape: { value: 'ao_cape', label: 'Cape / Áo choàng', icon: '🧣', group: 'outerwear' },
    ao_teddy: { value: 'ao_teddy', label: 'Teddy coat', icon: '🧸', group: 'outerwear' },
    ao_puffer: { value: 'ao_puffer', label: 'Puffer jacket', icon: '🧥', group: 'outerwear' },

    // ===== QUẦN (BOTTOMS) - 20+ types =====
    quan_tay: { value: 'quan_tay', label: 'Quần tây', icon: '👖', group: 'bottoms' },
    quan_tay_baggy: { value: 'quan_tay_baggy', label: 'Quần tây baggy', icon: '👖', group: 'bottoms' },
    quan_tay_ong_dung: { value: 'quan_tay_ong_dung', label: 'Quần âu ống đứng', icon: '👖', group: 'bottoms' },
    quan_jean: { value: 'quan_jean', label: 'Quần jean', icon: '👖', group: 'bottoms' },
    quan_jean_skinny: { value: 'quan_jean_skinny', label: 'Jean skinny', icon: '👖', group: 'bottoms' },
    quan_jean_straight: { value: 'quan_jean_straight', label: 'Jean straight', icon: '👖', group: 'bottoms' },
    quan_jean_wide_leg: { value: 'quan_jean_wide_leg', label: 'Jean ống rộng', icon: '👖', group: 'bottoms' },
    quan_jean_flare: { value: 'quan_jean_flare', label: 'Jean ống loe', icon: '👖', group: 'bottoms' },
    quan_jean_baggy: { value: 'quan_jean_baggy', label: 'Jean baggy', icon: '👖', group: 'bottoms' },
    quan_short: { value: 'quan_short', label: 'Quần short', icon: '🩳', group: 'bottoms' },
    quan_short_jean: { value: 'quan_short_jean', label: 'Short jeans', icon: '🩳', group: 'bottoms' },
    quan_ong_rong: { value: 'quan_ong_rong', label: 'Quần ống rộng', icon: '👖', group: 'bottoms' },
    quan_culottes: { value: 'quan_culottes', label: 'Quần culottes', icon: '👖', group: 'bottoms' },
    quan_jogger: { value: 'quan_jogger', label: 'Quần jogger', icon: '🏃', group: 'bottoms' },
    quan_legging: { value: 'quan_legging', label: 'Quần legging', icon: '🦵', group: 'bottoms' },
    quan_palazzo: { value: 'quan_palazzo', label: 'Quần palazzo', icon: '👖', group: 'bottoms' },
    quan_cargo: { value: 'quan_cargo', label: 'Quần cargo', icon: '👖', group: 'bottoms' },
    quan_parachute: { value: 'quan_parachute', label: 'Quần parachute', icon: '🪂', group: 'bottoms' },
    quan_ong_vay: { value: 'quan_ong_vay', label: 'Quần ống váy', icon: '👖', group: 'bottoms' },
    quan_yem: { value: 'quan_yem', label: 'Quần yếm', icon: '👖', group: 'bottoms' },

    // ===== VÁY (SKIRTS) - 15+ types =====
    chan_vay: { value: 'chan_vay', label: 'Chân váy', icon: '👗', group: 'skirts' },
    vay_a: { value: 'vay_a', label: 'Váy chữ A', icon: '👗', group: 'skirts' },
    vay_but_chi: { value: 'vay_but_chi', label: 'Váy bút chì', icon: '👗', group: 'skirts' },
    vay_xoe: { value: 'vay_xoe', label: 'Váy xòe', icon: '💃', group: 'skirts' },
    vay_midi: { value: 'vay_midi', label: 'Váy midi', icon: '👗', group: 'skirts' },
    vay_maxi: { value: 'vay_maxi', label: 'Váy maxi', icon: '👗', group: 'skirts' },
    vay_mini: { value: 'vay_mini', label: 'Váy mini', icon: '👗', group: 'skirts' },
    vay_xep_li: { value: 'vay_xep_li', label: 'Váy xếp ly', icon: '👗', group: 'skirts' },
    vay_tennis: { value: 'vay_tennis', label: 'Váy tennis', icon: '🎾', group: 'skirts' },
    vay_wrap: { value: 'vay_wrap', label: 'Váy wrap / Đắp chéo', icon: '👗', group: 'skirts' },
    vay_tulip: { value: 'vay_tulip', label: 'Váy tulip', icon: '🌷', group: 'skirts' },
    vay_duoi_ca: { value: 'vay_duoi_ca', label: 'Váy đuôi cá', icon: '🧜‍♀️', group: 'skirts' },
    vay_jeans: { value: 'vay_jeans', label: 'Váy jeans', icon: '👗', group: 'skirts' },
    vay_ren: { value: 'vay_ren', label: 'Váy ren', icon: '🤍', group: 'skirts' },
    vay_bet: { value: 'vay_bet', label: 'Váy bèo', icon: '👗', group: 'skirts' },

    // ===== ĐẦM (DRESSES) - 25+ types =====
    vay_dam: { value: 'vay_dam', label: 'Đầm / Váy liền', icon: '👗', group: 'dresses' },
    dam_da_hoi: { value: 'dam_da_hoi', label: 'Đầm dạ hội', icon: '✨', group: 'dresses' },
    dam_cocktail: { value: 'dam_cocktail', label: 'Đầm cocktail', icon: '🍸', group: 'dresses' },
    dam_cuoi: { value: 'dam_cuoi', label: 'Đầm cưới', icon: '💒', group: 'dresses' },
    dam_phu_dau: { value: 'dam_phu_dau', label: 'Đầm phù dâu', icon: '💐', group: 'dresses' },
    dam_du_tiec: { value: 'dam_du_tiec', label: 'Đầm dự tiệc', icon: '🎉', group: 'dresses' },
    dam_cong_so: { value: 'dam_cong_so', label: 'Đầm công sở', icon: '💼', group: 'dresses' },
    dam_de_thuong: { value: 'dam_de_thuong', label: 'Đầm dễ thương', icon: '🌸', group: 'dresses' },
    dam_bo: { value: 'dam_bo', label: 'Đầm bodycon', icon: '👗', group: 'dresses' },
    dam_suong: { value: 'dam_suong', label: 'Đầm suông', icon: '👗', group: 'dresses' },
    dam_vintage: { value: 'dam_vintage', label: 'Đầm vintage', icon: '📻', group: 'dresses' },
    dam_maxi: { value: 'dam_maxi', label: 'Đầm maxi', icon: '👗', group: 'dresses' },
    dam_midi: { value: 'dam_midi', label: 'Đầm midi', icon: '👗', group: 'dresses' },
    dam_mini: { value: 'dam_mini', label: 'Đầm mini', icon: '👗', group: 'dresses' },
    dam_wrap: { value: 'dam_wrap', label: 'Đầm wrap / Đắp chéo', icon: '👗', group: 'dresses' },
    dam_slip: { value: 'dam_slip', label: 'Slip dress', icon: '👗', group: 'dresses' },
    dam_babydoll: { value: 'dam_babydoll', label: 'Đầm babydoll', icon: '🎀', group: 'dresses' },
    dam_shirt: { value: 'dam_shirt', label: 'Shirt dress', icon: '👔', group: 'dresses' },
    dam_blazer: { value: 'dam_blazer', label: 'Blazer dress', icon: '🧥', group: 'dresses' },
    dam_cami: { value: 'dam_cami', label: 'Cami dress', icon: '👗', group: 'dresses' },
    dam_tiered: { value: 'dam_tiered', label: 'Đầm tầng / Tiered dress', icon: '👗', group: 'dresses' },
    dam_cut_out: { value: 'dam_cut_out', label: 'Đầm cut-out', icon: '✂️', group: 'dresses' },
    dam_knit: { value: 'dam_knit', label: 'Đầm len', icon: '🧶', group: 'dresses' },
    dam_hoa: { value: 'dam_hoa', label: 'Đầm hoa', icon: '🌺', group: 'dresses' },
    dam_sequin: { value: 'dam_sequin', label: 'Đầm sequin / Kim sa', icon: '✨', group: 'dresses' },

    // ===== BỘ ĐỒ (SETS/JUMPSUITS) - 15+ types =====
    jumpsuit: { value: 'jumpsuit', label: 'Jumpsuit', icon: '🦸', group: 'sets' },
    jumpsuit_short: { value: 'jumpsuit_short', label: 'Jumpsuit ngắn', icon: '🦸', group: 'sets' },
    romper: { value: 'romper', label: 'Romper', icon: '👶', group: 'sets' },
    pantsuit: { value: 'pantsuit', label: 'Pantsuit', icon: '👩‍💼', group: 'sets' },
    bo_vest: { value: 'bo_vest', label: 'Bộ vest', icon: '🤵', group: 'sets' },
    bo_do_ngu: { value: 'bo_do_ngu', label: 'Bộ đồ ngủ', icon: '🌙', group: 'sets' },
    bo_tap_gym: { value: 'bo_tap_gym', label: 'Bộ tập gym', icon: '🏋️', group: 'sets' },
    bo_tap_yoga: { value: 'bo_tap_yoga', label: 'Bộ tập yoga', icon: '🧘', group: 'sets' },
    bo_di_bien: { value: 'bo_di_bien', label: 'Bộ đi biển', icon: '🏖️', group: 'sets' },
    bo_co_ord: { value: 'bo_co_ord', label: 'Co-ord set', icon: '👯', group: 'sets' },
    bo_pijama: { value: 'bo_pijama', label: 'Bộ pijama', icon: '😴', group: 'sets' },
    bo_blazer_short: { value: 'bo_blazer_short', label: 'Bộ blazer + short', icon: '🧥', group: 'sets' },
    ao_lien_quan: { value: 'ao_lien_quan', label: 'Liền thân / Playsuit', icon: '🎀', group: 'sets' },
    overalls: { value: 'overalls', label: 'Overalls / Quần yếm', icon: '👷', group: 'sets' },

    // ===== TRUYỀN THỐNG (TRADITIONAL) - 15+ types =====
    ao_dai: { value: 'ao_dai', label: 'Áo dài', icon: '🇻🇳', group: 'traditional' },
    ao_dai_cuoi: { value: 'ao_dai_cuoi', label: 'Áo dài cưới', icon: '💒', group: 'traditional' },
    ao_dai_tet: { value: 'ao_dai_tet', label: 'Áo dài Tết', icon: '🧧', group: 'traditional' },
    ao_dai_hoc_sinh: { value: 'ao_dai_hoc_sinh', label: 'Áo dài học sinh', icon: '📚', group: 'traditional' },
    ao_dai_cach_tan: { value: 'ao_dai_cach_tan', label: 'Áo dài cách tân', icon: '🇻🇳', group: 'traditional' },
    ao_tu_than: { value: 'ao_tu_than', label: 'Áo tứ thân', icon: '🎎', group: 'traditional' },
    ao_ba_ba: { value: 'ao_ba_ba', label: 'Áo bà ba', icon: '🌾', group: 'traditional' },
    hanbok: { value: 'hanbok', label: 'Hanbok (Hàn Quốc)', icon: '🇰🇷', group: 'traditional' },
    kimono: { value: 'kimono', label: 'Kimono (Nhật Bản)', icon: '🇯🇵', group: 'traditional' },
    yukata: { value: 'yukata', label: 'Yukata', icon: '🇯🇵', group: 'traditional' },
    kebaya: { value: 'kebaya', label: 'Kebaya (Indonesia)', icon: '🇮🇩', group: 'traditional' },
    sari: { value: 'sari', label: 'Sari (Ấn Độ)', icon: '🇮🇳', group: 'traditional' },
    cheongsam: { value: 'cheongsam', label: 'Sườn xám (Trung Quốc)', icon: '🇨🇳', group: 'traditional' },
    ao_nhat_binh: { value: 'ao_nhat_binh', label: 'Áo Nhật bình', icon: '👘', group: 'traditional' },

    // ===== BIKINI & ĐỒ BƠI (SWIMWEAR) - 10+ types =====
    bikini: { value: 'bikini', label: 'Bikini', icon: '👙', group: 'swimwear' },
    bikini_2_manh: { value: 'bikini_2_manh', label: 'Bikini 2 mảnh', icon: '👙', group: 'swimwear' },
    bikini_1_manh: { value: 'bikini_1_manh', label: 'Đồ bơi liền', icon: '🩱', group: 'swimwear' },
    bikini_high_waist: { value: 'bikini_high_waist', label: 'Bikini cạp cao', icon: '👙', group: 'swimwear' },
    monokini: { value: 'monokini', label: 'Monokini', icon: '👙', group: 'swimwear' },
    tankini: { value: 'tankini', label: 'Tankini', icon: '🩱', group: 'swimwear' },
    sarong: { value: 'sarong', label: 'Sarong / Khăn quấn biển', icon: '🏖️', group: 'swimwear' },
    cover_up: { value: 'cover_up', label: 'Beach cover-up', icon: '🏖️', group: 'swimwear' },

    // ===== PHỤ KIỆN (ACCESSORIES) - 15+ types =====
    khan_choang: { value: 'khan_choang', label: 'Khăn choàng', icon: '🧣', group: 'accessories' },
    khan_turban: { value: 'khan_turban', label: 'Khăn turban', icon: '🧕', group: 'accessories' },
    that_lung: { value: 'that_lung', label: 'Thắt lưng', icon: '🪢', group: 'accessories' },
    mu_non: { value: 'mu_non', label: 'Mũ / Nón', icon: '🎩', group: 'accessories' },
    mu_bucket: { value: 'mu_bucket', label: 'Bucket hat', icon: '🎩', group: 'accessories' },
    mu_beret: { value: 'mu_beret', label: 'Mũ beret', icon: '🎨', group: 'accessories' },
    gang_tay: { value: 'gang_tay', label: 'Găng tay', icon: '🧤', group: 'accessories' },
    ca_vat: { value: 'ca_vat', label: 'Cà vạt', icon: '👔', group: 'accessories' },
    no_bung: { value: 'no_bung', label: 'Nơ / Nơ bướm', icon: '🎀', group: 'accessories' },
    tui_xach: { value: 'tui_xach', label: 'Túi xách', icon: '👜', group: 'accessories' },
    clutch: { value: 'clutch', label: 'Clutch bag', icon: '👝', group: 'accessories' },

    // ===== ĐỒ NỘI Y (LINGERIE) - 5+ types =====
    ao_nguc: { value: 'ao_nguc', label: 'Áo ngực', icon: '👙', group: 'lingerie' },
    ao_bralette: { value: 'ao_bralette', label: 'Bralette', icon: '🌸', group: 'lingerie' },
    ao_corset_noi_y: { value: 'ao_corset_noi_y', label: 'Corset nội y', icon: '🎀', group: 'lingerie' },
    do_ngu_sexy: { value: 'do_ngu_sexy', label: 'Đồ ngủ sexy', icon: '💋', group: 'lingerie' },
    kimono_noi_y: { value: 'kimono_noi_y', label: 'Kimono nội y', icon: '👘', group: 'lingerie' },
};

// Nhóm TYPE theo category cho filter
export const TYPE_GROUPS = {
    tops: {
        label: '👔 Áo',
        types: ['ao_so_mi', 'ao_so_mi_oversize', 'ao_so_mi_croptop', 'ao_thun', 'ao_thun_basic', 'ao_thun_graphic', 'ao_polo', 'ao_len', 'ao_len_co_lo', 'ao_hoodie', 'ao_croptop', 'ao_kiem', 'ao_ba_lo', 'ao_hai_day', 'ao_tube_top', 'ao_corset', 'ao_peplum', 'ao_wrap', 'ao_off_shoulder', 'ao_one_shoulder', 'ao_babydoll', 'ao_bodysuit', 'ao_bra_top']
    },
    outerwear: {
        label: '🧥 Áo khoác',
        types: ['ao_khoac', 'ao_khoac_bomber', 'ao_khoac_da', 'ao_khoac_jean', 'ao_khoac_parka', 'ao_khoac_trench', 'ao_khoac_long', 'ao_khoac_mong', 'blazer', 'blazer_oversize', 'blazer_crop', 'vest', 'cardigan', 'ao_cape', 'ao_teddy', 'ao_puffer']
    },
    bottoms: {
        label: '👖 Quần',
        types: ['quan_tay', 'quan_tay_baggy', 'quan_tay_ong_dung', 'quan_jean', 'quan_jean_skinny', 'quan_jean_straight', 'quan_jean_wide_leg', 'quan_jean_flare', 'quan_jean_baggy', 'quan_short', 'quan_short_jean', 'quan_ong_rong', 'quan_culottes', 'quan_jogger', 'quan_legging', 'quan_palazzo', 'quan_cargo', 'quan_parachute', 'quan_ong_vay', 'quan_yem']
    },
    skirts: {
        label: '👗 Váy',
        types: ['chan_vay', 'vay_a', 'vay_but_chi', 'vay_xoe', 'vay_midi', 'vay_maxi', 'vay_mini', 'vay_xep_li', 'vay_tennis', 'vay_wrap', 'vay_tulip', 'vay_duoi_ca', 'vay_jeans', 'vay_ren', 'vay_bet']
    },
    dresses: {
        label: '✨ Đầm',
        types: ['vay_dam', 'dam_da_hoi', 'dam_cocktail', 'dam_cuoi', 'dam_phu_dau', 'dam_du_tiec', 'dam_cong_so', 'dam_de_thuong', 'dam_bo', 'dam_suong', 'dam_vintage', 'dam_maxi', 'dam_midi', 'dam_mini', 'dam_wrap', 'dam_slip', 'dam_babydoll', 'dam_shirt', 'dam_blazer', 'dam_cami', 'dam_tiered', 'dam_cut_out', 'dam_knit', 'dam_hoa', 'dam_sequin']
    },
    sets: {
        label: '🎯 Bộ đồ',
        types: ['jumpsuit', 'jumpsuit_short', 'romper', 'pantsuit', 'bo_vest', 'bo_do_ngu', 'bo_tap_gym', 'bo_tap_yoga', 'bo_di_bien', 'bo_co_ord', 'bo_pijama', 'bo_blazer_short', 'ao_lien_quan', 'overalls']
    },
    traditional: {
        label: '🏮 Truyền thống',
        types: ['ao_dai', 'ao_dai_cuoi', 'ao_dai_tet', 'ao_dai_hoc_sinh', 'ao_dai_cach_tan', 'ao_tu_than', 'ao_ba_ba', 'hanbok', 'kimono', 'yukata', 'kebaya', 'sari', 'cheongsam', 'ao_nhat_binh']
    },
    swimwear: {
        label: '🏖️ Đồ bơi',
        types: ['bikini', 'bikini_2_manh', 'bikini_1_manh', 'bikini_high_waist', 'monokini', 'tankini', 'sarong', 'cover_up']
    },
    accessories: {
        label: '🎀 Phụ kiện',
        types: ['khan_choang', 'khan_turban', 'that_lung', 'mu_non', 'mu_bucket', 'mu_beret', 'gang_tay', 'ca_vat', 'no_bung', 'tui_xach', 'clutch']
    },
    lingerie: {
        label: '💋 Nội y',
        types: ['ao_nguc', 'ao_bralette', 'ao_corset_noi_y', 'do_ngu_sexy', 'kimono_noi_y']
    },
};

// === GENDER ===
export const GENDER_OPTIONS = [
    { value: '', label: 'Tất cả', icon: '👥' },
    { value: 'female', label: 'Nữ', icon: '👩' },
    { value: 'male', label: 'Nam', icon: '👨' },
    { value: 'unisex', label: 'Unisex', icon: '👤' },
];

// === OCCASION (Dịp sử dụng) ===
export const OCCASION_OPTIONS = [
    { value: '', label: 'Tất cả dịp' },
    { value: 'daily', label: '☀️ Hàng ngày', icon: '☀️' },
    { value: 'work', label: '💼 Công sở', icon: '💼' },
    { value: 'party', label: '🎉 Tiệc tùng', icon: '🎉' },
    { value: 'wedding', label: '💒 Cưới hỏi', icon: '💒' },
    { value: 'formal', label: '🎩 Trang trọng', icon: '🎩' },
    { value: 'casual', label: '😎 Dạo phố', icon: '😎' },
    { value: 'date', label: '💕 Hẹn hò', icon: '💕' },
    { value: 'beach', label: '🏖️ Đi biển', icon: '🏖️' },
    { value: 'gym', label: '🏋️ Tập gym', icon: '🏋️' },
    { value: 'yoga', label: '🧘 Yoga', icon: '🧘' },
    { value: 'travel', label: '✈️ Du lịch', icon: '✈️' },
    { value: 'tet', label: '🧧 Tết', icon: '🧧' },
    { value: 'photoshoot', label: '📸 Chụp ảnh', icon: '📸' },
    { value: 'graduation', label: '🎓 Tốt nghiệp', icon: '🎓' },
    { value: 'festival', label: '🎭 Lễ hội', icon: '🎭' },
    { value: 'night_out', label: '🌙 Đi chơi đêm', icon: '🌙' },
    { value: 'brunch', label: '🥂 Brunch', icon: '🥂' },
];

// === SEASON (Mùa) ===
export const SEASON_OPTIONS = [
    { value: '', label: 'Tất cả mùa' },
    { value: 'spring', label: '🌸 Mùa xuân', icon: '🌸' },
    { value: 'summer', label: '☀️ Mùa hè', icon: '☀️' },
    { value: 'autumn', label: '🍂 Mùa thu', icon: '🍂' },
    { value: 'winter', label: '❄️ Mùa đông', icon: '❄️' },
    { value: 'all_season', label: '🌍 Cả năm', icon: '🌍' },
];

// === STYLE (Phong cách - MỞ RỘNG) ===
export const STYLE_OPTIONS = [
    { value: '', label: 'Tất cả phong cách' },
    { value: 'elegant', label: '✨ Sang trọng', icon: '✨' },
    { value: 'casual', label: '😎 Casual', icon: '😎' },
    { value: 'vintage', label: '📻 Vintage', icon: '📻' },
    { value: 'modern', label: '🆕 Hiện đại', icon: '🆕' },
    { value: 'romantic', label: '💕 Lãng mạn', icon: '💕' },
    { value: 'minimalist', label: '⬜ Tối giản', icon: '⬜' },
    { value: 'bohemian', label: '🌻 Bohemian', icon: '🌻' },
    { value: 'streetwear', label: '🛹 Streetwear', icon: '🛹' },
    { value: 'gothic', label: '🖤 Gothic', icon: '🖤' },
    { value: 'preppy', label: '📚 Preppy', icon: '📚' },
    { value: 'sporty', label: '⚽ Sporty', icon: '⚽' },
    { value: 'sexy', label: '💋 Sexy', icon: '💋' },
    { value: 'cute', label: '🎀 Dễ thương', icon: '🎀' },
    { value: 'traditional', label: '🏮 Truyền thống', icon: '🏮' },
    { value: 'y2k', label: '💿 Y2K', icon: '💿' },
    { value: 'old_money', label: '💎 Old Money', icon: '💎' },
    { value: 'quiet_luxury', label: '🤍 Quiet Luxury', icon: '🤍' },
    { value: 'coquette', label: '🎀 Coquette', icon: '🎀' },
    { value: 'dark_academia', label: '📖 Dark Academia', icon: '📖' },
    { value: 'light_academia', label: '🏛️ Light Academia', icon: '🏛️' },
    { value: 'coastal_grandmother', label: '🌊 Coastal Grandmother', icon: '🌊' },
    { value: 'cottagecore', label: '🌾 Cottagecore', icon: '🌾' },
    { value: 'grunge', label: '🎸 Grunge', icon: '🎸' },
    { value: 'avant_garde', label: '🎨 Avant-garde', icon: '🎨' },
];

// === PRICE RANGE ===
export const PRICE_RANGE_OPTIONS = [
    { value: '', label: 'Tất cả mức giá' },
    { value: 'budget', label: '💰 Giá rẻ (< 500k)', icon: '💰' },
    { value: 'mid_range', label: '💵 Tầm trung (500k-2tr)', icon: '💵' },
    { value: 'premium', label: '💎 Cao cấp (2tr-5tr)', icon: '💎' },
    { value: 'luxury', label: '👑 Luxury (> 5tr)', icon: '👑' },
];

// === MATERIALS (Chất liệu - MỞ RỘNG) ===
export const MATERIAL_OPTIONS = [
    { value: 'cotton', label: '🌿 Cotton', icon: '🌿' },
    { value: 'cotton_organic', label: '🌱 Cotton hữu cơ', icon: '🌱' },
    { value: 'silk', label: '✨ Lụa', icon: '✨' },
    { value: 'satin', label: '💫 Satin', icon: '💫' },
    { value: 'linen', label: '🌾 Linen', icon: '🌾' },
    { value: 'wool', label: '🐑 Len', icon: '🐑' },
    { value: 'cashmere', label: '🐐 Cashmere', icon: '🐐' },
    { value: 'velvet', label: '🟣 Nhung', icon: '🟣' },
    { value: 'denim', label: '👖 Denim', icon: '👖' },
    { value: 'leather', label: '🤎 Da thật', icon: '🤎' },
    { value: 'faux_leather', label: '🖤 Da tổng hợp', icon: '🖤' },
    { value: 'lace', label: '🤍 Ren', icon: '🤍' },
    { value: 'chiffon', label: '💨 Voan', icon: '💨' },
    { value: 'organza', label: '🌸 Organza', icon: '🌸' },
    { value: 'tulle', label: '✨ Tulle / Vải lưới', icon: '✨' },
    { value: 'crepe', label: '〽️ Crepe', icon: '〽️' },
    { value: 'tweed', label: '🧥 Tweed', icon: '🧥' },
    { value: 'polyester', label: '🔷 Polyester', icon: '🔷' },
    { value: 'spandex', label: '🏃 Spandex / Thun', icon: '🏃' },
    { value: 'kaki', label: '🟤 Kaki', icon: '🟤' },
    { value: 'taffeta', label: '💎 Taffeta', icon: '💎' },
    { value: 'sequin', label: '🌟 Sequin / Kim sa', icon: '🌟' },
    { value: 'brocade', label: '🏆 Gấm', icon: '🏆' },
    { value: 'jersey', label: '🏀 Jersey', icon: '🏀' },
    { value: 'corduroy', label: '🧵 Nhung tăm', icon: '🧵' },
];

// === Helper functions ===

/**
 * Lấy label hiển thị cho type value
 */
export const getTypeLabel = (value) => {
    if (!value) return 'Chưa phân loại';
    const type = TYPE_OPTIONS[value];
    return type ? `${type.icon} ${type.label}` : value;
};

/**
 * Lấy tất cả types dưới dạng array cho dropdown
 */
export const getAllTypesAsArray = () => {
    return Object.entries(TYPE_OPTIONS).map(([key, val]) => ({
        value: val.value,
        label: val.icon ? `${val.icon} ${val.label}` : val.label,
        group: val.group,
    }));
};

/**
 * Lấy types theo group
 */
export const getTypesByGroup = (group) => {
    const groupInfo = TYPE_GROUPS[group];
    if (!groupInfo) return [];
    return groupInfo.types.map(typeKey => TYPE_OPTIONS[typeKey]).filter(Boolean);
};

/**
 * Chuyển đổi type values cho AI prompt
 */
export const getAllTypeValuesForPrompt = () => {
    return Object.keys(TYPE_OPTIONS)
        .filter(key => key !== 'all')
        .join(', ');
};

/**
 * Đếm tổng số types
 */
export const getTotalTypesCount = () => {
    return Object.keys(TYPE_OPTIONS).filter(key => key !== 'all').length;
};

export default {
    CATEGORY_OPTIONS,
    TYPE_OPTIONS,
    TYPE_GROUPS,
    GENDER_OPTIONS,
    OCCASION_OPTIONS,
    SEASON_OPTIONS,
    STYLE_OPTIONS,
    PRICE_RANGE_OPTIONS,
    MATERIAL_OPTIONS,
    getTypeLabel,
    getAllTypesAsArray,
    getTypesByGroup,
    getAllTypeValuesForPrompt,
    getTotalTypesCount,
};

/**
 * Dữ liệu quy trình đầu tư — dựng từ "Cấu trúc tài liệu dự án (03.05.2026).xlsx".
 *
 * Cây quy trình được khai báo bằng text thụt đầu dòng để giữ đúng hình dạng file nguồn,
 * dễ đối chiếu và dễ sửa cùng nghiệp vụ. Mỗi dòng: "Tên node |flag |flag".
 *
 *   kind=...   loại node: stage | group | task | docset | output | consult
 *   gate       node là mốc kiểm soát (phải đủ hồ sơ mới được chuyển bước)
 *   cond=...   chỉ áp dụng khi điều kiện trong Project Profile thỏa mãn
 *   note=...   ghi chú suy luận cấu trúc cần nghiệp vụ xác nhận
 *   upload     bắt buộc node nhận tài liệu, kể cả khi có bước con
 *   container  bắt buộc node chỉ dùng để phân nhóm
 */

const TREE_TEXT = `
QUY HOẠCH (Quy hoạch chung, quy hoạch phân khu, quy hoạch chi tiết) |kind=stage
  Nhiệm vụ quy hoạch |kind=group
    Lập nhiệm vụ đồ án
    Lấy ý kiến (cộng đồng dân cư, cơ quan liên quan)
    Thẩm định nhiệm vụ
    Phê duyệt nhiệm vụ |kind=output
  Lựa chọn đơn vị tư vấn |kind=group
    Lập dự toán
    Thẩm định dự toán
    Phê duyệt dự toán |kind=output
    Lập kế hoạch lựa chọn Tư vấn
    Thẩm định kế hoạch lựa chọn Tư vấn
    Phê duyệt kế hoạch lựa chọn tư vấn |kind=output
  Đấu thầu lựa chọn tư vấn |kind=group |note=Nguồn để cùng cấp với "Lựa chọn đơn vị tư vấn"; cần nghiệp vụ xác nhận quan hệ
  Khảo sát địa hình QHPK |kind=group
    Khảo sát đo đạc địa hình
    Xác nhận bản đồ đo đạc |kind=output
  Đồ án QH |kind=group
    Lập hồ sơ đồ án |kind=docset
    Ý kiến đồ án (cộng đồng dân cư, cơ quan liên quan)
    Thẩm định đồ án
    Phê duyệt đồ án |kind=output |gate

CHỦ TRƯƠNG ĐẦU TƯ, NHÀ ĐẦU TƯ |kind=stage
  Dự án chấp thuận CTĐT - chấp thuận NĐT |kind=group |cond=hinh_thuc_ndt=chap_thuan
    Hồ sơ liên quan (SDĐ địa phương, QH chuyên ngành, PTNO, QH rừng...) |kind=docset
    Hồ sơ đề xuất chấp thuận CTĐT |kind=docset
      Nội dung đề xuất
      FS dự án
      Pháp lý kèm theo
    Ý kiến các cơ quan chuyên môn
    Thẩm định HSĐX chấp thuận CTĐT
    Phê duyệt HSĐX chấp thuận CTĐT |kind=output |gate
  Dự án đấu thầu nhà đầu tư |kind=group |cond=hinh_thuc_ndt=dau_thau
    Hồ sơ liên quan (SDĐ địa phương, QH chuyên ngành, PTNO, QH rừng...) |kind=docset
    Danh mục dự án đầu tư có sử dụng đất |kind=group
      Đề xuất danh mục
      Thẩm định danh mục
      Phê duyệt, công bố danh mục |kind=output
      Hồ sơ đăng ký thực hiện dự án |kind=docset
    Chủ trương đầu tư |kind=group
      Hồ sơ chấp thuận CTĐT |kind=docset
      Thẩm định chấp thuận CTĐT
      Phê duyệt chấp thuận CTĐT |kind=output |gate
    Đấu thầu nhà đầu tư |kind=group
      Kế hoạch đấu thầu (lập, thẩm định, phê duyệt)
      Hồ sơ mời thầu (lập, thẩm định, phê duyệt) |kind=docset
      Hồ sơ dự thầu |kind=docset
      Chấm thầu
      Kết quả đấu thầu NĐT, ký hợp đồng |kind=output |gate
  Dự án đấu giá quyền SDĐ |kind=group |cond=hinh_thuc_ndt=dau_gia |note=Nguồn chưa có bước con; cần bổ sung hoặc xác nhận ngoài phạm vi

THỦ TỤC ĐẤT ĐAI |kind=stage
  Giải phóng mặt bằng |kind=group |cond=co_gpmb=co
    Công tác chuẩn bị GPMB |kind=group
      Tư vấn trích đo, GPMB |kind=consult
      Bản đồ trích đo GPMB |kind=output
      Thành lập Hội đồng GPMB
      Kế hoạch GPMB (lập, thẩm định, phê duyệt)
    Triển khai GPMB |kind=group
      Khảo sát, đo đạc, kiểm đếm các hộ
      Phương án GPMB (lập, thẩm định, phê duyệt)
      Chi trả tiền GPMB
      Các trường hợp phải cưỡng chế |cond=co_cuong_che=co
      Quyết định thu hồi đất, quản lý đất sau GPMB |kind=output
      Quyết toán chi phí GPMB
  Giao đất, cho thuê đất, chuyển mục đích SDĐ |kind=group
    Trích đo địa chính giao đất, cho thuê, chuyển mục đích |kind=group
      Tư vấn trích đo |kind=consult
      Bản đồ trích đo |kind=output
    Hồ sơ đề nghị giao đất, cho thuê, chuyển mục đích |kind=docset
    Thẩm định hồ sơ đề nghị giao đất, cho thuê, chuyển mục đích
    Quyết định giao đất, cho thuê, chuyển mục đích |kind=output |gate
    Bàn giao đất ngoài thực địa |kind=output |gate
  Giấy chứng nhận quyền SDĐ |kind=group
    Trích đo địa chính cấp giấy chứng nhận quyền SDĐ |kind=group
      Tư vấn trích đo |kind=consult
      Bản đồ trích đo |kind=output
    Hồ sơ đề nghị cấp giấy chứng nhận quyền SDĐ |kind=docset
    Nghĩa vụ tài chính về đất đai
    Giấy chứng nhận quyền SDĐ |kind=output |gate

THỦ TỤC MÔI TRƯỜNG |kind=stage
  Đánh giá tác động môi trường |kind=group |cond=thuoc_dtm=co
    Lập hồ sơ ĐTM |kind=group
      Tư vấn ĐTM |kind=consult
      Hồ sơ ĐTM |kind=docset
    Tham vấn ý kiến ĐTM
    Thẩm định ĐTM
    Phê duyệt ĐTM |kind=output |gate
  Giấy phép môi trường |kind=group |cond=thuoc_gpmt=co
    Lập hồ sơ cấp phép môi trường |kind=group
      Tư vấn lập hồ sơ cấp phép môi trường |kind=consult
      Hồ sơ cấp phép môi trường |kind=docset
        Nghiệm thu công trình môi trường |note=Nguồn thụt lề không nhất quán; đang tạm coi là con của "Hồ sơ cấp phép môi trường"
        Kế hoạch ứng phó sự cố môi trường |note=Nguồn thụt lề không nhất quán; cần nghiệp vụ xác nhận
        Chương trình quan trắc môi trường |note=Nguồn thụt lề không nhất quán; cần nghiệp vụ xác nhận
    Giấy phép môi trường |kind=output |gate

NGHIÊN CỨU KHẢ THI |kind=stage
  Lập hồ sơ khảo sát địa chất |kind=group
    Tư vấn khảo sát địa chất |kind=consult
    Hồ sơ khảo sát địa chất |kind=docset
  Lập hồ sơ TKCS |kind=group
    Tư vấn TKCS |kind=consult
    Hồ sơ TKCS |kind=docset
    Ý kiến PCCC |cond=thuoc_pccc=co
    Thẩm tra TKCS
  Thỏa thuận đấu nối hạ tầng với các đơn vị chủ quản
  Quyết định đầu tư Dự án |kind=output |gate

GIẤY PHÉP XÂY DỰNG |kind=stage
  Lập hồ sơ thiết kế BVTC |kind=group
    Tư vấn BVTC |kind=consult
    Hồ sơ BVTC |kind=docset
  Thẩm tra hồ sơ thiết kế BVTC
  Phê duyệt hồ sơ thiết kế BVTC |kind=output |gate
  Thẩm duyệt PCCC |kind=group |cond=thuoc_pccc=co
    Tư vấn lập hồ sơ PCCC |kind=consult
    Hồ sơ thẩm duyệt PCCC |kind=docset
    Thẩm duyệt PCCC |kind=output |gate
  Cấp phép xây dựng |kind=group |cond=phai_xin_gpxd=co
    Hồ sơ cấp phép xây dựng |kind=docset
    Giấy phép xây dựng |kind=output |gate

TỔ CHỨC THI CÔNG |kind=stage
  Phân chia gói thầu thi công |note=Giai đoạn này ở file nguồn chỉ có 2 mục; có thể còn thiếu hồ sơ quản lý thi công
  Lựa chọn đơn vị thi công

NGHIỆM THU HOÀN THÀNH ĐƯA VÀO SỬ DỤNG |kind=stage
  Nghiệm thu hoàn thành phần xây dựng |kind=group
    Biên bản nghiệm thu |kind=docset
    Kết quả thí nghiệm, kiểm định |kind=docset
    Kiểm tra, nghiệm thu xây dựng |kind=output |gate
  Nghiệm thu PCCC |kind=group |cond=thuoc_pccc=co
    Hồ sơ đề nghị nghiệm thu PCCC |kind=docset
    Kiểm tra, nghiệm thu PCCC |kind=output |gate
`;

/** 34 đơn vị hành chính cấp tỉnh hiện hành, dùng cho ô gợi ý địa điểm. */
const PROVINCES = [
  'An Giang', 'Bắc Ninh', 'Cà Mau', 'Cần Thơ', 'Cao Bằng', 'Đà Nẵng',
  'Đắk Lắk', 'Điện Biên', 'Đồng Nai', 'Đồng Tháp', 'Gia Lai', 'Hà Nội',
  'Hà Tĩnh', 'Hải Phòng', 'Hồ Chí Minh', 'Huế', 'Hưng Yên', 'Khánh Hòa',
  'Lai Châu', 'Lâm Đồng', 'Lạng Sơn', 'Lào Cai', 'Nghệ An', 'Ninh Bình',
  'Phú Thọ', 'Quảng Ngãi', 'Quảng Ninh', 'Quảng Trị', 'Sơn La', 'Tây Ninh',
  'Thái Nguyên', 'Thanh Hóa', 'Tuyên Quang', 'Vĩnh Long',
];

/** 10 câu hỏi khởi tạo dự án — chỉ những câu làm thay đổi quy trình. */
const PROFILE_FIELDS = [
  {
    id: 'ten_du_an',
    label: 'Tên dự án',
    type: 'text',
    required: true,
    hint: 'Dùng để hiển thị và tra cứu.',
  },
  {
    id: 'dia_diem',
    label: 'Địa điểm thực hiện',
    type: 'location',
    required: true,
    hint: 'Gõ chữ cái đầu để lọc (ví dụ H → Hà Nội, Hải Phòng…). Cần chọn đúng một tỉnh/thành trong danh sách.',
  },
  {
    id: 'hinh_thuc_ndt',
    label: 'Hình thức chấp thuận / lựa chọn nhà đầu tư',
    type: 'choice',
    hint: 'Đây là câu quyết định nhiều nhất: nó chọn nhánh nào ở giai đoạn 2.',
    options: [
      { value: 'chap_thuan', label: 'Chấp thuận CTĐT đồng thời chấp thuận NĐT' },
      { value: 'dau_thau', label: 'Đấu thầu lựa chọn nhà đầu tư' },
      { value: 'dau_gia', label: 'Đấu giá quyền sử dụng đất' },
      { value: 'chua_xac_dinh', label: 'Chưa xác định' },
    ],
  },
  {
    id: 'co_gpmb',
    label: 'Dự án có phải giải phóng mặt bằng không?',
    type: 'yesno',
    hint: 'Quyết định có bật toàn bộ nhóm quy trình GPMB hay không.',
  },
  {
    id: 'co_cuong_che',
    label: 'Có trường hợp phải cưỡng chế không?',
    type: 'yesno',
    hint: 'Thường chỉ biết khi đã triển khai GPMB. Chưa rõ thì chọn "Chưa xác định".',
  },
  {
    id: 'thuoc_dtm',
    label: 'Dự án có thuộc đối tượng thực hiện ĐTM không?',
    type: 'yesno',
    hint: 'Câu này cần pháp chế / SME môi trường xác nhận, không nên tự suy đoán.',
  },
  {
    id: 'thuoc_gpmt',
    label: 'Dự án có thuộc đối tượng phải có giấy phép môi trường không?',
    type: 'yesno',
    hint: 'Tương tự, cần pháp chế / SME môi trường xác nhận.',
  },
  {
    id: 'phai_xin_gpxd',
    label: 'Dự án có phải xin giấy phép xây dựng không?',
    type: 'yesno',
    hint: 'Nếu không, phải ghi rõ căn cứ; không để trống.',
  },
  {
    id: 'thuoc_pccc',
    label: 'Dự án có thuộc diện thực hiện thủ tục PCCC không?',
    type: 'yesno',
    hint: 'Ảnh hưởng tới cả giai đoạn 5, 6 và 8.',
  },
  {
    id: 'tinh_trang_qh',
    label: 'Tình trạng quy hoạch hiện tại',
    type: 'choice',
    hint: 'Chưa dùng để bật/tắt bước trong demo, nhưng cần cho báo cáo.',
    options: [
      { value: 'chua_co', label: 'Chưa có quy hoạch' },
      { value: 'dang_lap', label: 'Đang lập' },
      { value: 'da_duyet', label: 'Đã được phê duyệt' },
      { value: 'chua_xac_dinh', label: 'Chưa xác định' },
    ],
  },
];

const YESNO_OPTIONS = [
  { value: 'co', label: 'Có' },
  { value: 'khong', label: 'Không' },
  { value: 'chua_xac_dinh', label: 'Chưa xác định' },
];

/** Nhãn hiển thị cho loại node. */
const KIND_LABEL = {
  stage: 'Giai đoạn',
  group: 'Nhóm quy trình',
  task: 'Công việc',
  docset: 'Bộ hồ sơ',
  output: 'Kết quả / tài liệu',
  consult: 'Dịch vụ tư vấn',
};

/** Ba mức áp dụng của một node sau khi soi Project Profile. */
const APPLY = {
  YES: 'apply',
  NO: 'na',
  UNKNOWN: 'unknown',
};

/* ------------------------------------------------------------------ parser */

function parseTree(text) {
  const stages = [];
  let counter = 0;
  const stack = [];

  text.split('\n').forEach((rawLine) => {
    if (!rawLine.trim()) return;

    const indent = rawLine.length - rawLine.trimStart().length;
    const level = Math.floor(indent / 2);
    const [namePart, ...flagParts] = rawLine.trim().split('|');

    const node = {
      id: '',
      name: namePart.trim(),
      level,
      kind: 'task',
      gate: false,
      cond: null,
      note: null,
      uploadRole: null,
      children: [],
    };

    flagParts.forEach((flag) => {
      const value = flag.trim();
      if (value === 'gate') node.gate = true;
      else if (value === 'upload') node.uploadRole = 'upload';
      else if (value === 'container') node.uploadRole = 'container';
      else if (value.startsWith('kind=')) node.kind = value.slice(5);
      else if (value.startsWith('note=')) node.note = value.slice(5);
      else if (value.startsWith('cond=')) {
        const [field, expected] = value.slice(5).split('=');
        node.cond = { field, expected };
      }
    });

    if (level === 0) {
      node.stageIndex = stages.length + 1;
      node.id = `S${String(node.stageIndex).padStart(2, '0')}`;
      counter = 0;
      stages.push(node);
      stack.length = 0;
      stack[0] = node;
      return;
    }

    const stage = stages[stages.length - 1];
    counter += 1;
    node.stageIndex = stage.stageIndex;
    node.id = `${stage.id}-${String(counter).padStart(3, '0')}`;

    const parent = stack[level - 1] || stage;
    parent.children.push(node);
    node.parentId = parent.id;
    stack[level] = node;
    stack.length = level + 1;
  });

  return stages;
}

const STAGES = parseTree(TREE_TEXT);

/** Trả về mảng phẳng toàn bộ node, tiện cho việc đếm và tra cứu. */
function flattenNodes(stages = STAGES) {
  const out = [];
  const walk = (node) => {
    out.push(node);
    node.children.forEach(walk);
  };
  stages.forEach(walk);
  return out;
}

const ALL_NODES = flattenNodes();
const NODE_BY_ID = new Map(ALL_NODES.map((node) => [node.id, node]));

/**
 * Chỉ node nhận tài liệu mới có checklist và drawer upload.
 * Mặc định node cuối nhánh là folder; cờ upload/container cho phép nghiệp vụ ghi đè.
 */
function acceptsUpload(node) {
  if (!node || node.kind === 'stage') return false;
  if (node.uploadRole === 'upload') return true;
  if (node.uploadRole === 'container') return false;
  return node.children.length === 0;
}

/**
 * Quy tắc áp dụng. Điểm cốt lõi: "chưa có dữ liệu" KHÔNG bị suy thành "không áp dụng".
 * Node không có điều kiện thì luôn áp dụng; node có điều kiện thì soi Project Profile.
 */
function evaluateApply(node, profile) {
  if (!node.cond) return APPLY.YES;
  const answer = profile?.[node.cond.field];
  if (!answer || answer === 'chua_xac_dinh') return APPLY.UNKNOWN;
  return answer === node.cond.expected ? APPLY.YES : APPLY.NO;
}

/** Mức áp dụng thực tế của node, có tính cả node cha (cha N/A thì con cũng N/A). */
function resolveApply(node, profile, inherited = APPLY.YES) {
  const own = evaluateApply(node, profile);
  if (inherited === APPLY.NO || own === APPLY.NO) return APPLY.NO;
  if (inherited === APPLY.UNKNOWN || own === APPLY.UNKNOWN) return APPLY.UNKNOWN;
  return APPLY.YES;
}

/* ============================================================
   Dữ liệu mở rộng cho chức năng gợi ý quy trình (AI Assistant)
   ============================================================ */

/** Bỏ dấu + hạ case để so sánh tiếng Việt ("Nhà ở xã hội" ~ "nha o xa hoi"). */
function normText(value) {
  return String(value || '').normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase();
}

/** Các loại dự án nhận diện được từ câu hỏi. Thứ tự = thứ tự ưu tiên khớp từ khóa. */
const PROJECT_TYPES = [
  {
    id: 'noxa',
    label: 'Nhà ở xã hội',
    tone: 'purple',
    keywords: ['xa hoi'],
    intro: 'Quy trình đầu tư nhà ở xã hội theo quy định hiện hành.',
    beginnerIntro: 'Nhà ở xã hội là loại nhà ở được Nhà nước hỗ trợ cho đối tượng chính sách, người thu nhập thấp — nên ngoài quy trình chung sẽ có thêm ưu đãi và các thủ tục thẩm định riêng.',
  },
  {
    id: 'nthuongmai',
    label: 'Nhà ở thương mại',
    tone: 'blue',
    keywords: ['thuong mai'],
    intro: 'Quy trình đầu tư nhà ở thương mại theo quy định hiện hành.',
    beginnerIntro: 'Nhà ở thương mại là nhà ở do doanh nghiệp bỏ vốn đầu tư để bán/cho thuê theo giá thị trường — khâu then chốt là chọn nhà đầu tư và thủ tục đất đai.',
  },
  {
    id: 'khudothi',
    label: 'Khu đô thị mới',
    tone: 'green',
    keywords: ['khu do thi', 'do thi moi'],
    intro: 'Quy trình đầu tư khu đô thị mới theo quy định hiện hành.',
    beginnerIntro: 'Khu đô thị mới là dự án xây dựng đồng bộ hạ tầng + nhà ở trên khu đất mới — thường phải tự lập quy hoạch chi tiết và giải phóng mặt bằng quy mô lớn.',
  },
  {
    id: 'khucongnghiep',
    label: 'Khu công nghiệp',
    tone: 'orange',
    keywords: ['khu cong nghiep', 'cong nghiep'],
    intro: 'Quy trình đầu tư khu công nghiệp theo quy định hiện hành.',
    beginnerIntro: 'Khu công nghiệp là khu chuyên sản xuất công nghiệp — bắt buộc có đánh giá môi trường và phòng cháy chữa cháy ở mức độ cao.',
  },
  {
    id: 'hatang',
    label: 'Hạ tầng kỹ thuật',
    tone: 'slate',
    keywords: ['ha tang'],
    intro: 'Quy trình đầu tư hạ tầng kỹ thuật theo quy định hiện hành.',
    beginnerIntro: 'Hạ tầng kỹ thuật là đường, cống thoát nước, chiếu sáng, cấp điện... — thường không có công trình nhà ở nên một số thủ tục đất đai sẽ khác.',
  },
  {
    id: 'chung',
    label: 'Chưa rõ loại dự án',
    tone: 'gray',
    keywords: [],
    intro: 'Quy trình đầu tư tổng quát — áp dụng cho đa số dự án xây dựng.',
    beginnerIntro: 'Chưa nhận diện được loại dự án cụ thể nên hệ thống đưa ra quy trình tổng quát; các mục chưa đủ thông tin sẽ để "Chưa xác định".',
  },
];

function identifyType(query) {
  const norm = normText(query);
  return PROJECT_TYPES.find((type) => type.keywords.some((key) => norm.includes(key)))
    || PROJECT_TYPES[PROJECT_TYPES.length - 1];
}

function typeById(id) {
  return PROJECT_TYPES.find((type) => type.id === id) || PROJECT_TYPES[PROJECT_TYPES.length - 1];
}

/** Mô tả ngắn + thời lượng tham khảo + giải thích dễ hiểu cho từng giai đoạn. */
const STAGE_META = {
  S01: {
    desc: 'Lập và phê duyệt các đồ án quy hoạch (quy hoạch chung, phân khu, chi tiết).',
    duration: '3–6 tháng',
    beginner: 'Kiểm tra khu đất đã có quy hoạch được duyệt chưa; nếu chưa thì phải làm thủ tục lập quy hoạch. Quy hoạch là "khung" quyết định được xây gì, xây bao nhiêu.',
  },
  S02: {
    desc: 'Thủ tục chấp thuận chủ trương đầu tư và lựa chọn nhà đầu tư.',
    duration: '2–4 tháng',
    beginner: 'Xin phép Nhà nước cho làm dự án và xác định ai là nhà đầu tư — bằng một trong ba hình thức: chấp thuận, đấu thầu hoặc đấu giá.',
  },
  S03: {
    desc: 'Giải phóng mặt bằng, giao đất / cho thuê đất, cấp giấy chứng nhận quyền sử dụng đất.',
    duration: '3–6 tháng',
    beginner: 'Các thủ tục để có quyền sử dụng đất hợp pháp: đền bù giải phóng mặt bằng, nhận giao đất và cấp "sổ đỏ".',
  },
  S04: {
    desc: 'Đánh giá tác động môi trường và giấy phép môi trường theo luật định.',
    duration: '2–4 tháng',
    beginner: 'Đánh giá dự án ảnh hưởng gì tới môi trường xung quanh và xin giấy phép môi trường trước khi vận hành.',
  },
  S05: {
    desc: 'Khảo sát địa chất, thiết kế cơ sở, ra quyết định đầu tư.',
    duration: '2–3 tháng',
    beginner: 'Khảo sát địa chất, thiết kế và tính toán chi phí để trả lời "làm được không, hết bao nhiêu, hiệu quả không" trước khi quyết định bỏ vốn.',
  },
  S06: {
    desc: 'Thiết kế bản vẽ thi công, thẩm duyệt PCCC và cấp giấy phép xây dựng.',
    duration: '2–3 tháng',
    beginner: 'Hoàn thiện thiết kế chi tiết, thẩm duyệt phòng cháy chữa cháy và xin giấy phép xây dựng trước khi khởi công.',
  },
  S07: {
    desc: 'Phân chia gói thầu, lựa chọn nhà thầu và tổ chức thi công.',
    duration: '12–24 tháng',
    beginner: 'Chọn đơn vị thi công và tổ chức xây dựng theo thiết kế đã duyệt — giai đoạn dài nhất của dự án.',
  },
  S08: {
    desc: 'Kiểm tra, nghiệm thu xây dựng và PCCC, đưa dự án vào sử dụng.',
    duration: '1–2 tháng',
    beginner: 'Kiểm tra chất lượng công trình và phòng cháy chữa cháy, hoàn tất thủ tục để bàn giao, đưa vào sử dụng.',
  },
};

/**
 * Rule theo loại dự án: ghi đè trạng thái khi có căn cứ nghiệp vụ rõ ràng.
 * match bằng chuỗi con của tên node (phân biệt hoa thường) hoặc số giai đoạn.
 */
const TYPE_RULES = {
  noxa: [
    { name: 'Dự án chấp thuận CTĐT', status: 'apply', why: 'Dự án nhà ở xã hội thường lựa chọn nhà đầu tư theo hình thức chấp thuận chủ trương đầu tư đồng thời chấp thuận nhà đầu tư, nên nhóm này áp dụng.' },
    { name: 'Dự án đấu giá quyền SDĐ', status: 'na', why: 'Dự án nhà ở xã hội không thực hiện theo hình thức đấu giá quyền sử dụng đất, nên nhóm này không áp dụng.' },
    { name: 'Ý kiến PCCC', status: 'apply', why: 'Nhà ở xã hội (đặc biệt nhà nhiều tầng) thuộc diện phải thẩm tra phòng cháy chữa cháy, nên cần ý kiến PCCC ở bước thiết kế cơ sở.' },
    { name: 'Thẩm duyệt PCCC', status: 'apply', why: 'Công trình nhà ở xã hội thuộc diện thẩm duyệt thiết kế PCCC trước khi cấp phép xây dựng.' },
    { name: 'Nghiệm thu PCCC', status: 'apply', why: 'Công trình nhà ở xã hội phải nghiệm thu PCCC trước khi đưa vào sử dụng.' },
    { name: 'Cấp phép xây dựng', status: 'apply', why: 'Dự án nhà ở xã hội thường phải xin giấy phép xây dựng (trừ trường hợp được miễn theo luật).' },
  ],
  nthuongmai: [
    { name: 'Thẩm duyệt PCCC', status: 'unknown', why: 'Nhà ở thương mại có thuộc diện thẩm duyệt PCCC hay không phụ thuộc quy mô (số tầng, diện tích); chưa có thông tin nên tạm để chưa xác định.' },
    { name: 'Nghiệm thu PCCC', status: 'unknown', why: 'Tương tự thẩm duyệt, nghiệm thu PCCC phụ thuộc quy mô công trình; chưa có thông tin nên tạm để chưa xác định.' },
  ],
  khudothi: [
    { name: 'Đồ án QH', status: 'apply', why: 'Dự án khu đô thị mới phải tự lập quy hoạch chi tiết 1/500, nên nhóm hồ sơ đồ án áp dụng đầy đủ.' },
    { name: 'Giải phóng mặt bằng', status: 'unknown', why: 'Khu đô thị mới thường phải giải phóng mặt bằng quy mô lớn, nhưng chưa có thông tin hiện trạng đất nên tạm để chưa xác định.' },
    { name: 'Dự án đấu giá quyền SDĐ', status: 'unknown', why: 'Tùy hiện trạng đất sạch hay chưa, nhà đầu tư có thể được chọn qua đấu giá hoặc đấu thầu; chưa rõ nên tạm để chưa xác định.' },
  ],
  khucongnghiep: [
    { name: 'Đánh giá tác động môi trường', status: 'apply', why: 'Khu công nghiệp thuộc đối tượng bắt buộc đánh giá tác động môi trường theo luật, nên nhóm này áp dụng.' },
    { name: 'Giấy phép môi trường', status: 'apply', why: 'Hạ tầng khu công nghiệp khi vận hành bắt buộc có giấy phép môi trường.' },
    { name: 'Thẩm duyệt PCCC', status: 'apply', why: 'Khu công nghiệp thuộc diện thẩm duyệt thiết kế PCCC.' },
    { name: 'Nghiệm thu PCCC', status: 'apply', why: 'Khu công nghiệp phải nghiệm thu PCCC trước khi vận hành.' },
    { name: 'Cấp phép xây dựng', status: 'apply', why: 'Công trình trong khu công nghiệp thường phải xin giấy phép xây dựng.' },
    { name: 'Dự án đấu giá quyền SDĐ', status: 'na', why: 'Nhà đầu tư khu công nghiệp được lựa chọn qua đấu thầu hoặc chấp thuận, không qua đấu giá quyền sử dụng đất.' },
  ],
  hatang: [
    { name: 'Giấy chứng nhận quyền SDĐ', status: 'unknown', why: 'Dự án hạ tầng kỹ thuật có thể không phải cấp giấy chứng nhận nếu không giao đất; chưa rõ hình thức sử dụng đất nên tạm để chưa xác định.' },
    { name: 'Cấp phép xây dựng', status: 'unknown', why: 'Một số công trình hạ tầng kỹ thuật được miễn giấy phép xây dựng; tùy trường hợp cụ thể nên tạm để chưa xác định.' },
  ],
  chung: [],
};

function matchRule(node, rule) {
  if (rule.stage && node.stageIndex !== rule.stage) return false;
  if (rule.name && !node.name.includes(rule.name)) return false;
  return true;
}

/**
 * Tính trạng thái ba mức cho MỌI node theo loại dự án + khảo sát người dùng.
 * Thứ tự ưu tiên: cha N/A (cứng) → cond đã trả lời → rule loại dự án →
 * cha chưa xác định → cond thiếu → áp dụng mặc định.
 */
function computeStatuses(type, profile) {
  const rules = TYPE_RULES[type.id] || [];
  const map = new Map();

  const fieldLabel = (fieldId) => {
    const field = PROFILE_FIELDS.find((f) => f.id === fieldId);
    return field ? field.label : fieldId;
  };
  const optionLabel = (fieldId, value) => {
    const field = PROFILE_FIELDS.find((f) => f.id === fieldId);
    const options = field?.options || YESNO_OPTIONS;
    return options.find((o) => o.value === value)?.label || value;
  };

  const walk = (node, inherited) => {
    let status;
    let why;

    const answer = node.cond ? (profile || {})[node.cond.field] : null;
    const answered = node.cond && answer && answer !== 'chua_xac_dinh';
    const rule = rules.find((r) => matchRule(node, r));

    if (inherited.status === APPLY.NO) {
      status = APPLY.NO;
      why = `Vì nhóm cha "${inherited.name}" không áp dụng nên bước này cũng không áp dụng.`;
    } else if (answered) {
      // Nhóm chưa có dữ liệu bước con (ví dụ nguồn còn thiếu): không kết luận "Không áp dụng" — để Chưa xác định
      const emptyGroup = node.kind === 'group' && node.children.length === 0;
      if (answer === node.cond.expected) {
        status = APPLY.YES;
        why = `Vì theo thông tin khảo sát, dự án thuộc trường hợp "${optionLabel(node.cond.field, answer)}" của mục "${fieldLabel(node.cond.field)}".`;
      } else if (emptyGroup) {
        status = APPLY.UNKNOWN;
        why = 'Nguồn quy trình hiện chưa có dữ liệu bước con cho mục này, nên hệ thống để trạng thái "Chưa xác định" thay vì kết luận áp dụng hay không. Cần bổ sung hoặc xác nhận ngoài phạm vi.';
      } else {
        status = APPLY.NO;
        why = `Vì theo thông tin khảo sát, dự án không thuộc trường hợp áp dụng của mục "${fieldLabel(node.cond.field)}".`;
      }
    } else if (rule) {
      // Nhóm chưa có dữ liệu bước con: không kết luận "Không áp dụng" dù rule ghi na — để Chưa xác định
      const emptyGroup = node.kind === 'group' && node.children.length === 0;
      if (rule.status === APPLY.NO && emptyGroup) {
        status = APPLY.UNKNOWN;
        why = 'Nguồn quy trình hiện chưa có dữ liệu bước con cho mục này, nên hệ thống để trạng thái "Chưa xác định" thay vì kết luận không áp dụng. Cần bổ sung hoặc xác nhận ngoài phạm vi.';
      } else {
        status = rule.status;
        why = rule.why;
      }
    } else if (inherited.status === APPLY.UNKNOWN) {
      status = APPLY.UNKNOWN;
      why = `Vì nhóm cha "${inherited.name}" chưa xác định nên bước này cũng chưa xác định.`;
    } else if (node.cond) {
      status = APPLY.UNKNOWN;
      why = `Vì bạn chưa cung cấp thông tin "${fieldLabel(node.cond.field)}". Trả lời ở mục Khảo sát nhanh để có kết quả chính xác.`;
    } else {
      status = APPLY.YES;
      why = 'Đây là bước có trong quy trình đầu tư của hầu hết loại hình dự án.';
    }

    map.set(node.id, { status, why });
    node.children.forEach((child) => walk(child, { status, name: node.name }));
  };

  STAGES.forEach((stage) => walk(stage, { status: APPLY.YES, name: '' }));

  return { map };
}

/** Trạng thái tổng hợp của một giai đoạn: N/A nếu tất cả con N/A; chưa xác định nếu có con chưa xác định; ngược lại áp dụng. */
function aggregateStage(stage, map) {
  let allNa = true;
  let anyUnknown = false;
  const walk = (node) => {
    const { status } = map.get(node.id);
    if (status !== APPLY.NO) allNa = false;
    if (status === APPLY.UNKNOWN) anyUnknown = true;
    node.children.forEach(walk);
  };
  stage.children.forEach(walk);
  if (allNa && stage.children.length) return APPLY.NO;
  if (anyUnknown) return APPLY.UNKNOWN;
  return APPLY.YES;
}

/** Gợi ý quy trình hoàn chỉnh cho một loại dự án + profile khảo sát. */
function suggest(type, profile) {
  const { map } = computeStatuses(type, profile);
  const stages = STAGES.map((stage) => ({
    node: stage,
    status: aggregateStage(stage, map),
    ...STAGE_META[stage.id],
  }));
  const counts = { apply: 0, unknown: 0, na: 0 };
  ALL_NODES.forEach((node) => {
    if (node.kind === 'stage') return;
    counts[map.get(node.id).status] += 1;
  });
  counts.total = counts.apply + counts.unknown + counts.na;
  return { typeId: type.id, map, stages, counts };
}

window.HacomData = {
  STAGES,
  ALL_NODES,
  NODE_BY_ID,
  PROFILE_FIELDS,
  PROVINCES,
  YESNO_OPTIONS,
  KIND_LABEL,
  APPLY,
  acceptsUpload,
  resolveApply,
  normText,
  PROJECT_TYPES,
  identifyType,
  typeById,
  STAGE_META,
  suggest,
};

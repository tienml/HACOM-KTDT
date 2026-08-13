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
};

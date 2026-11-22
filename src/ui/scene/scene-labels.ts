export const selectionLabel = (selection: string): string => {
  switch (selection) {
    case "hydro":
      return "Cụm thủy điện";
    case "thermal":
      return "Nhà máy nhiệt điện";
    case "renewable":
      return "Trang trại tái tạo";
    case "substation":
      return "Trạm biến áp";
    case "urban":
      return "Phụ tải đô thị";
    case "industrial":
      return "Khu công nghiệp";
    default:
      return "Phụ tải nông thôn";
  }
};

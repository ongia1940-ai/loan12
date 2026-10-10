# Loạn 12 Sứ Quân — Cấu trúc và học thuyết thiết kế

## 1. Tầm nhìn

**Loạn 12 Sứ Quân** là trò chơi chiến thuật thời gian thực 2.5D lấy cảm hứng từ thời kỳ phân tranh thế kỷ X. Trò chơi kết hợp:

- Kinh tế hữu hình kiểu Age of Empires: dân phu phải khai thác, mang hàng và nộp vào kho.
- Nhịp giao tranh nhanh: đội hình phản ứng nhanh, khắc chế rõ và thời gian giao chiến ngắn.
- Lựa chọn chính trị: thu phục hoặc trảm tướng để thay đổi lực lượng và cây công nghệ.
- Mười hai thế lực có đặc tính, đội hình và hướng phát triển riêng.
- Kiến trúc Việt cổ cách điệu, thể hiện rõ ba cấp phát triển ngay trên chiến trường.

### Bốn trụ cột thiết kế

1. **Tài nguyên phải được vận chuyển:** không có thu nhập miễn phí.
2. **Công trình quyết định chiến thuật:** mỗi nhà mở một nhánh quân sự hoặc hậu cần cụ thể.
3. **Địa hình là một loại vũ khí:** bùn, rừng, đồi và sông thay đổi tốc độ, tầm nhìn và khả năng chiến đấu.
4. **Thống nhất bằng nhiều con đường:** người chơi có thể tiêu diệt, thu phục hoặc xây dựng liên minh quân sự.

---

## 2. Vòng lặp trò chơi

```text
Khai thác → Vận chuyển → Xây dựng → Tuyển quân
     ↑                                  ↓
Phát triển lãnh thổ ← Thu phục ← Giao chiến
```

### Giai đoạn đầu — Khai lập

- Dựng Nhà Dân, Kho Tài Nguyên và Nông Trang.
- Phân công Dân Phu cho lương, gỗ, đá, vàng hoặc sắt.
- Trinh sát đường bộ, đường sông và vị trí các sứ quân.
- Tuyển bộ binh cấp I để bảo vệ tuyến vận chuyển.

### Giai đoạn giữa — Quân trấn

- Nâng Đại Bản Doanh lên cấp II.
- Mở Lò Rèn, Tháp Canh, Máy Bắn Đá, quân giáp nặng và hạm đội chiến đấu.
- Chiếm các nút tài nguyên quan trọng.
- Bắt đầu lựa chọn thu phục hoặc trảm tướng.

### Giai đoạn cuối — Thành lũy

- Nâng công trình chủ lực lên cấp III.
- Triển khai quân tinh nhuệ, chiến hạm lớn và hệ thống phòng thủ nhiều lớp.
- Kết hợp Danh Tướng, quân bản địa và khí tài công thành.
- Đánh sập hoặc thu phục toàn bộ các Đại Bản Doanh đối địch.

---

## 3. Cấu trúc kinh tế

### Tài nguyên

| Tài nguyên | Nguồn | Công dụng chính |
|---|---|---|
| Lương | Nông Trang, ruộng | Dân Phu, bộ binh, voi và Danh Tướng |
| Gỗ | Rừng | Nhà, cung nỏ, tàu và khung máy công thành |
| Đá | Mỏ đá | Công trình kiên cố, tháp và thành lũy |
| Vàng | Mỏ vàng | Danh Tướng, quân tinh nhuệ và chiến hạm |
| Sắt | Mỏ sắt | Giáp, vũ khí, Máy Bắn Đá và công nghệ cao |

### Học thuyết kinh tế hữu hình

- Tài nguyên không tự cộng theo thời gian.
- Dân Phu phải đi tới nguồn, khai thác, mang hàng và trở về điểm nộp.
- Nguồn tài nguyên có giới hạn và có thể cạn.
- Kho gần mỏ rút ngắn tuyến vận chuyển nhưng cần được bảo vệ.
- Mất toàn bộ điểm nộp khiến Dân Phu giữ hàng và chờ đường vận chuyển mới.
- Nâng cấp hậu cần chỉ tăng tốc độ khai thác, không tạo tài nguyên từ hư không.

### Nhà Dân và phân công lao động

- Tăng giới hạn dân số theo cấp: 8 / 12 / 16.
- Tuyển Dân Phu.
- Là điểm nộp hàng phụ.
- Cho phép tổ chức cụm dân cư gần vùng khai thác.

---

## 4. Cây công trình

### Công trình trung tâm

| Công trình | Vai trò |
|---|---|
| Đại Bản Doanh | Mở cấp thời đại, sức chứa dân số và điều kiện nâng cấp toàn lãnh địa |
| Nhà Dân | Dân số, tuyển Dân Phu và nộp tài nguyên |
| Kho Tài Nguyên | Điểm nộp hàng gần rừng và mỏ |
| Nông Trang | Nguồn lương hữu hạn cần Dân Phu canh tác |

### Công trình quân sự

| Công trình | Nhánh phát triển |
|---|---|
| Võ Doanh | Dân binh, kích binh, giáp sĩ, đao binh và voi chiến |
| Trường Bắn & Cơ Khí | Cung thủ, nỏ thủ, lính lao và Máy Bắn Đá |
| Thủy Xưởng | Thuyền trinh sát, vận tải, hỏa công và chiến hạm |
| Soái Phủ | Danh Tướng và Sĩ Phu |

### Công trình nghiên cứu và hỗ trợ

| Công trình | Tác dụng |
|---|---|
| Xưởng Mộc | Hậu cần, thành đá ong và công nghệ xây dựng |
| Lò Rèn | Nâng sát thương, giáp và đầu tên |
| Tháp Canh | Tự bắn quân địch trong tầm; mở từ Đại Bản Doanh II |
| Giếng Làng | Hồi phục bộ binh gần đó sau khi rời giao tranh |

### Phân cấp kiến trúc

#### Cấp I — Làng Việt

- Mái tranh hoặc mái ngói đơn.
- Tường đất, khung gỗ và móng thấp.
- Ít cửa sổ, ít công trình phụ.

#### Cấp II — Quân Trấn

- Móng đá rõ hơn, mái ngói đỏ và cánh nhà phụ.
- Tháp góc, sân nghề và biển hiệu chuyên môn.
- Mở công trình phòng thủ và quân trang bị sắt.

#### Cấp III — Thành Lũy

- Nhiều tầng, thành chắn, đài quan sát và họa tiết phe.
- Khối kiến trúc lớn, bóng đổ rõ và công trình phụ hoàn chỉnh.
- Tăng HP, tốc độ sản xuất và phẩm cấp quân mới.

---

## 5. Học thuyết quân sự

### Bộ binh tuyến trước

- **Dân Binh:** rẻ, nhanh, dùng trinh sát và quấy rối.
- **Kích Binh:** giữ đội hình, chống voi và kỵ binh.
- **Giáp Sĩ:** chịu đòn, bảo vệ xạ thủ và khí tài.
- **Đao Binh:** bộ binh cấp II cân bằng giữa tốc độ và sát thương.

### Hỏa lực tuyến sau

- **Cung Thủ:** tầm xa cơ bản, cơ động.
- **Lính Lao:** rẻ, khắc chế quân ít giáp tên.
- **Nỏ Thủ Liên Châu:** bắn ba tia, hiệu quả trên đồi và chống mục tiêu bọc giáp.
- Luôn cần bộ binh chắn trước; không nên đứng đơn độc ở địa hình hẹp.

### Khí tài công thành

#### Máy Bắn Đá

- Cần Trường Bắn & Cơ Khí cấp II.
- Tiêu thụ gỗ, đá và sắt.
- Tầm bắn xa, sát thương lan và gây gấp đôi sát thương lên công trình.
- Di chuyển chậm, giáp thấp và không được Sĩ Phu hoặc Giếng Làng hồi phục.
- Đội hình chuẩn: Giáp Sĩ phía trước, Kích Binh hai cánh, Máy Bắn Đá ở giữa phía sau.

#### Học thuyết sử dụng

1. Dùng trinh sát xác định Tháp Canh và tuyến tiếp viện.
2. Giữ Máy Bắn Đá ngoài tầm bộ binh địch.
3. Tập trung bắn Tháp Canh, Lò Rèn hoặc Trường Bắn trước.
4. Không đưa máy vào bùn lầy hoặc đường rừng hẹp nếu chưa có bộ binh hộ tống.

### Tháp Canh

- Cần Đại Bản Doanh II.
- Tầm cơ bản 8 ô; cấp cao tăng tầm nhẹ, sát thương và tốc độ bắn.
- Tự chọn mục tiêu gần nhất có đường bắn rõ.
- Hiệu quả nhất khi đặt cạnh kho, cầu, bến cảng hoặc lối vào mỏ.
- Không thay thế quân phòng thủ; có thể bị Máy Bắn Đá triệt hạ từ ngoài tầm.

### Công trình hồi phục

- Giếng Làng hồi phục tối đa ba bộ binh cùng lúc.
- Chỉ hoạt động với quân đã rời giao tranh ít nhất 5 giây.
- Không hồi phục tàu, voi hoặc máy công thành.
- Tạo điểm nghỉ chiến phía sau Tháp Canh và tuyến phòng thủ.

---

## 6. Học thuyết thủy quân

| Đơn vị | Vai trò |
|---|---|
| Thuyền Nan | Trinh sát nhanh, đi qua rạch nông |
| Thuyền Mui | Vận chuyển bộ binh |
| Thuyền Mãng Xà | Chiến đấu cơ động và hỏa tiễn |
| Hỏa Thuyền Hổ | Sát thương lan và phá đội hình tàu |
| Thuyền Lầu Vận Binh | Vận tải bọc giáp, chở tối đa 10 quân |
| Chiến Hạm Lâu Thuyền | Hỏa lực kép, tầm xa, cấp III |

### Nguyên tắc

- Tàu nhỏ kiểm soát sông và rạch nông.
- Tàu lớn kiểm soát vùng nước rộng nhưng bị giới hạn đường đi.
- Thủy quân phải phối hợp với bộ binh đổ bộ; không thể tự chiếm căn cứ trên bộ.
- Phá Thủy Xưởng làm gián đoạn toàn bộ chiến lược sông nước của đối phương.

---

## 7. Địa hình và đội hình

### Bùn lầy

- Giảm mạnh tốc độ voi và quân nặng.
- Dân Binh Cờ Lau ít bị ảnh hưởng.
- Không phù hợp cho Máy Bắn Đá cơ động.

### Rừng

- Cản đường và tầm nhìn.
- Tạo hành lang phục kích.
- Khai thác rừng có thể mở đường mới trên bản đồ.

### Đồi đá

- Xạ thủ nhận lợi thế hỏa lực.
- Thích hợp đặt Tháp Canh và tuyến phòng thủ tầm xa.

### Sông và rạch nông

- Bộ binh lội nước bị chậm và không thể tấn công.
- Thuyền nhỏ di chuyển tự do.
- Cầu, bến và cửa sông là các điểm chiến lược phải tranh chấp.

---

## 8. Danh Tướng và “Địa Linh — Nhân Kiệt”

### Giới hạn

- Tối đa hai Danh Tướng sống hoặc đang tuyển.
- Tướng tăng cấp, nhận điểm thiên phú và giữ tiến trình sau khi tái tuyển.
- Hào quang không cộng dồn vô hạn.

### Đinh Bộ Lĩnh

- Học thuyết bộ binh và trận địa Hoa Lư.
- Tăng tốc bộ binh, hồi phục khi rời giao tranh.
- Kỹ năng giải làm chậm/choáng và tăng giáp cho Giáp Sĩ.

### Trần Lãm

- Học thuyết thủy quân và hỏa công.
- Tăng tốc độ bắn cho tàu.
- Triệu hồi bè hỏa công truy tìm mục tiêu đường thủy.

---

## 9. Thu phục và trảm tướng

### Thu phục

- Mở binh chủng hoặc công nghệ riêng của phe bị đánh bại.
- Giữ lại một phần năng lực kinh tế và quân đội.
- Có thể nhận Phó Tướng hoặc hào quang hỗ trợ.
- Phù hợp với chiến lược dài hạn và quân đội đa dạng.

### Trảm tướng

- Nhận chiến lợi phẩm ngay lập tức.
- Loại bỏ cây công nghệ của đối thủ.
- Tạo thêm lao động phục vụ khai thác.
- Phù hợp với chiến lược đánh nhanh, dồn tài nguyên cho một đội quân chủ lực.

---

## 10. Học thuyết 12 sứ quân

| Sứ quân | Học thuyết ưu tiên | Phong cách AI |
|---|---|---|
| Đinh Bộ Lĩnh | Bộ binh Cờ Lau, phòng thủ–phản công | Giữ đội hình, tích quân rồi phản kích |
| Ngô Nhật Khánh | Nỏ liên châu, thành đá ong | Xây tuyến phòng thủ và bắn xa |
| Kiều Thuận | Voi chiến, công phá trực diện | Tập trung quân nặng, đánh một hướng |
| Trần Lãm | Thủy quân và hỏa công | Tranh sông, đóng tàu và đổ bộ |
| Kiều Công Hãn | Kích binh, giữ cửa ngõ | Chiếm địa hình hẹp, chống quân xung kích |
| Đỗ Cảnh Thạc | Giáp sĩ, phòng tuyến bền | Xây quân nặng và bảo vệ kinh tế |
| Nguyễn Khoan | Kinh tế cân bằng | Mở rộng kho và duy trì nhiều nguồn tài nguyên |
| Nguyễn Thủ Tiệp | Trinh sát, đánh nhanh | Quấy rối Dân Phu và tuyến vận chuyển |
| Nguyễn Siêu | Đao binh và áp lực trung kỳ | Nâng cấp sớm, tấn công liên tục |
| Lữ Đường | Dân binh đông, tiêu hao | Sản xuất số lượng lớn, bao vây nhiều hướng |
| Lý Khuê | Lính lao, chống xạ thủ | Cơ động, phản công quân tầm xa |
| Phạm Bạch Hổ | Quân tinh nhuệ và công thành | Tích sắt, dùng Máy Bắn Đá kết thúc trận |

Các đặc tính trên là luật cân bằng giả tưởng phục vụ trò chơi, không phải nhận định lịch sử.

---

## 11. Cấu trúc AI

Mỗi AI vận hành một nền kinh tế độc lập:

1. Phân công Dân Phu theo nhu cầu tài nguyên.
2. Xây Nhà Dân và Nông Trang.
3. Hoàn thiện Võ Doanh và Trường Bắn.
4. Nâng Đại Bản Doanh và công trình quân sự.
5. Tuyển quân theo học thuyết của phe.
6. Tấn công khi đạt ngưỡng sức mạnh.

AI không được nhận tài nguyên miễn phí, không dùng chung kho với người chơi và dừng phát triển sau khi bị thu phục hoặc tiêu diệt.

---

## 12. Multiplayer và bản đồ

### Multiplayer LAN

- Tối đa bốn người cùng quản lý một lãnh địa.
- Dùng chung quân, công trình và tài nguyên.
- Mệnh lệnh được phát theo thứ tự để hạn chế sai lệch mô phỏng.

### Các loại bản đồ

- **Đồng Bằng Hoa Lư:** cân bằng bộ binh, kinh tế và thủy chiến.
- **Châu Thổ Tam Giang:** nhiều nước, ưu tiên hạm đội và đổ bộ.
- **Sơn Cước Phong Châu:** đường hẹp, đồi đá và phục kích.
- **Duyên Hải Bố Hải:** bờ biển dài, nhiều điểm đóng Thủy Xưởng.

---

## 13. Nguyên tắc cân bằng

- Mỗi đơn vị mạnh phải có ít nhất một khắc chế rõ ràng.
- Công trình phòng thủ kéo dài thời gian phản ứng, không được tự thắng trận.
- Máy công thành thắng công trình nhưng thua quân cơ động áp sát.
- Quân tinh nhuệ phải chịu chi phí cơ hội về vàng, sắt và thời gian.
- Thu phục cho sức mạnh lâu dài; trảm tướng cho lợi thế tức thời.
- Nâng cấp hình ảnh phải đồng thời truyền đạt cấp, vai trò và trạng thái công trình.

---

## 14. Cấu trúc kỹ thuật bản demo

| Tệp | Trách nhiệm |
|---|---|
| `core.js` | Bản đồ, đơn vị, chiến đấu và đường đi nền tảng |
| `progression.js` | Công trình, nâng cấp, nghiên cứu, dân số và Danh Tướng |
| `economy.js` | Khai thác, mang hàng và nộp tài nguyên |
| `tactics.js` | Đội hình, lệnh chiến thuật, Tháp Canh và Giếng Làng |
| `factions.js` | Đặc tính 12 sứ quân |
| `ai.js` | Kinh tế và học thuyết phát triển của AI |
| `maps.js` | Các mẫu bản đồ chiến dịch |
| `iso-art.js` | Đồ họa Canvas 2.5D cho địa hình, quân và công trình |
| `game.js` | Điều khiển trận đấu và giao diện tương tác |
| `kingdom-ui.js` | Chọn phe, thông tin vương quốc và trưng bày đồ họa |
| `multiplayer.js` | Phòng LAN và đồng bộ mệnh lệnh |

## 15. Học thuyết Nỏ Thần

Nỏ Thần là nhánh quân sự tối hậu dùng chung cho mọi triều đại, nhưng hình dáng quân phục, màu giáp, mũ và cờ hiệu kế thừa bản sắc của phe đang chơi.

### Điều kiện mở khóa

1. Đại Bản Doanh đạt cấp III.
2. Trường Bắn & Cơ Khí đạt cấp III và đang rảnh.
3. Hoàn thành Đầu tên thép II.
4. Nghiên cứu **Bí pháp Nỏ Thần**: 220 Gỗ + 180 Vàng + 180 Sắt, 45 giây.

### Binh đoàn đặc biệt: Vệ Nỏ Thần

| Thuộc tính | Giá trị |
|---|---:|
| Chi phí | 110 Lương + 90 Gỗ + 50 Vàng + 70 Sắt |
| Dân số | 3 |
| Giới hạn | 6 quân sống hoặc đang tuyển |
| HP | 110 |
| Sát thương | 11 × 4 tia |
| Tầm bắn | 8 ô |
| Giáp chém / tên | 2 / 5 |
| Chu kỳ bắn | 2,8 giây |

Nỏ cánh kép xuyên 2 điểm giáp tên và gây thêm 35% sát thương lên công trình. Vai trò của đơn vị là phá đội hình giáp nặng và yểm trợ công thành; tốc độ chậm, giá cao và giới hạn quân số khiến nó cần bộ binh bảo vệ.

---

## 16. Lộ trình phát triển tiếp

1. Thêm đạn bay theo quỹ đạo và hoạt ảnh nạp Máy Bắn Đá.
2. Thêm thanh tầm bắn khi chọn Tháp Canh.
3. Cho AI xây Tháp Canh theo địa hình và tuyến vận chuyển.
4. Thêm tháp công thành di động và nỏ phá thành.
5. Bổ sung công trình văn hóa: đình làng, đền, bia đá và vườn thuốc.
6. Phân hóa kiến trúc và bảng màu riêng cho 12 sứ quân.
7. Tách dữ liệu cân bằng sang tệp cấu hình để chỉnh chỉ số không cần sửa mã.

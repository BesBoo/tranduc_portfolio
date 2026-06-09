# PHẦN 1 – PHÁC THẢO KIẾN TRÚC ANIMATION
⏱️ TIMELINE TỔNG (0s → 6s)
⏱️ 0s – 3s | Intro / Splash
Màn hình chỉ có:
Background gradient + light wave
Text lớn:
Hello, I'm
Tran Duy Duc
Không navbar
Không avatar card
Không typing

👉 Mục tiêu: gây ấn tượng ban đầu
⏱️ 3s – 4.5s | Hero Transition

Xảy ra đồng thời (song song):

Text transition
“Hello, I’m Tran Duy Duc”:
fade out + move up nhẹ
Tên:
scale ↓ + dịch sang trái
chuyển sang layout hình 2
Navbar xuất hiện
Slide từ top: -60px → top: 0
Fade in
Avatar card xuất hiện
Fade in + scale (0.9 → 1)
Move từ phải vào (translateX)
⏱️ 4.5s – 6s | Typing effect
Dòng: Aspiring Web Developer
Chạy typing từng ký tự
Cursor nhấp nháy
⏱️ Sau 6s | Interactive state
Card avatar:
Mouse hover → nghiêng theo chuột
Navbar hoạt động bình thường
# PHẦN 2 – PROMPT CHI TIẾT ĐỂ TẠO ANIMATION
Act as a senior frontend animation engineer.

I want to build a personal portfolio hero section with a cinematic intro animation.
Use modern web animation techniques (CSS, JavaScript, GSAP preferred).

Animation requirements:

1. Intro Splash (0s–3s):
- Show only a fullscreen hero section
- Dark background with purple gradient waves
- Large centered text:
  "Hello, I'm"
  "MARCK IVAN DEALA"
- No navbar, no avatar card

2. Hero Transition (after 3s):
- "Hello, I'm" fades out and slides up
- Name text transforms smoothly:
  - scales down
  - moves to the left
  - aligns with final hero layout
- Navbar slides in from top with fade-in
- Avatar card fades and slides in from the right

3. Typing Animation:
- Text: "Aspiring Web Developer"
- Typing effect with blinking cursor
- Starts after hero transition finishes

4. Avatar Card Interaction:
- 3D tilt hover effect
- Card rotates based on mouse position
- Use perspective and transform-style: preserve-3d

Deliver:
- Animation timeline explanation
- Recommended libraries
- Code snippets (HTML/CSS/JS)
- Clean, modern implementation

PROMPT RIÊNG CHO TỪNG HIỆU ỨNG
1️⃣ Intro + Transition (GSAP): 
Create a GSAP timeline animation:

- Delay 3 seconds
- Fade out and move up intro text
- Transform name text (scale, translate)
- Animate navbar sliding from top
- Animate avatar card entering from right
Use staggered animation where appropriate.

2️⃣ Typing Effect:
Create a typing animation for the text "Aspiring Web Developer":
- Type one character at a time
- Include blinking cursor
- Smooth timing
- No external library preferred

3️⃣ 3D Tilt Avatar Card:
Create a 3D hover tilt effect for a card:
- Rotate X and Y based on mouse position
- Use perspective
- Smooth transition
- Reset on mouse leave

# PHẦN 3 – STACK KHUYÊN DÙNG (RẤT QUAN TRỌNG)
| Mục                | Công nghệ                     |
| ------------------ | ----------------------------- |
| Timeline animation | **GSAP**                      |
| Typing effect      | JS thuần hoặc GSAP TextPlugin |
| Hover tilt         | JS + CSS transform            |
| Layout             | HTML + CSS Grid/Flex          |
| Background         | CSS gradient + pseudo-element |

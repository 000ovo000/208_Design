const express = require("express");
const cors = require("cors");
const path = require("path");
const familyMemberRoutes = require("./routes/family-members");
const meRoutes = require("./routes/me");
const moodRoutes = require("./routes/moods");
const postRoutes = require("./routes/posts");
const uploadRoutes = require("./routes/uploads");
const itemRoutes = require("./routes/items");
const dailyDropRoutes = require("./routes/daily-drop");

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// 测试后端是否能正常运行
app.get("/", (req, res) => {
  res.send("Family demo backend is running.");
});

app.use("/api/family-members", familyMemberRoutes);
app.use("/api/me", meRoutes);
app.use("/api/moods", moodRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/uploads", uploadRoutes);
app.use("/api", itemRoutes);
app.use("/api", dailyDropRoutes);

app.listen(PORT, () => {
  console.log(`Backend server running at http://localhost:${PORT}`);
});

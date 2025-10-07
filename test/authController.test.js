const express = require("express");
const request = require("supertest");
const jwt = require("jsonwebtoken");

jest.mock("../models", () => ({
  Admin: {
    findOne: jest.fn(),
  },
}));

const { Admin } = require("../models");
const authenticationController = require("../controller/authenticationController");

process.env.JWT_SECRET = "testsecret";

// --- SETUP EXPRESS APP DUMMY ---
const app = express();
app.use(express.json());

// Router yang merepresentasikan struktur kamu:
app.post("/login", authenticationController.handleLogin);
app.get("/user", authenticationController.authorize, (req, res) => {
  res.status(200).json({ message: "User authorized", user: req.user });
});
app.patch(
  "/request/:kode_request/approval",
  authenticationController.authorize,
  authenticationController.checkRole(["Kasubbag TURT"]),
  (req, res) => res.status(200).json({ message: "Approval granted" })
);
app.patch(
  "/request/:kode_request/finish",
  authenticationController.authorize,
  authenticationController.checkRole(["Pengelola BMN"]),
  (req, res) => res.status(200).json({ message: "Request finished" })
);

describe("authenticationController Tests", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  // ---------- HANDLE LOGIN ----------
  test("Login gagal karena username tidak ditemukan", async () => {
    Admin.findOne.mockResolvedValue(null);

    const res = await request(app).post("/login").send({
      username: "notfound",
      password: "123",
    });

    expect(res.statusCode).toBe(404);
    expect(res.body.errors[0].code).toBe("E-001");
  });

  test("Login gagal karena password salah", async () => {
    Admin.findOne.mockResolvedValue({
      username: "admin",
      password: "1234",
    });

    const res = await request(app).post("/login").send({
      username: "admin",
      password: "wrong",
    });

    expect(res.statusCode).toBe(401);
    expect(res.body.errors[0].code).toBe("E-001");
  });

  test("Login berhasil dan mengembalikan token", async () => {
    Admin.findOne.mockResolvedValue({
      id: 1,
      username: "admin",
      password: "1234",
      role: "Kasubbag TURT",
    });

    const res = await request(app).post("/login").send({
      username: "admin",
      password: "1234",
    });

    expect(res.statusCode).toBe(200);
    expect(res.body.token).toBeDefined();
  });

  // ---------- AUTHORIZE ----------
  test("Gagal authorize tanpa header Authorization", async () => {
    const res = await request(app).get("/user");
    expect(res.statusCode).toBe(401);
    expect(res.body.errors[0].code).toBe("E-003");
  });

  test("Gagal authorize karena token invalid", async () => {
    const res = await request(app)
      .get("/user")
      .set("Authorization", "Bearer invalidtoken");

    expect(res.statusCode).toBe(401);
    expect(res.body.errors[0].code).toBe("E-004");
  });

  test("Berhasil authorize dengan token valid", async () => {
    const token = jwt.sign(
      { id: 1, role: "Kasubbag TURT" },
      process.env.JWT_SECRET
    );

    const res = await request(app)
      .get("/user")
      .set("Authorization", `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe("User authorized");
  });

  // ---------- CHECK ROLE ----------
  test("checkRole gagal karena role tidak diizinkan (Kasubbag TURT saja yang boleh)", async () => {
    const token = jwt.sign(
      { id: 1, role: "Pengelola BMN" },
      process.env.JWT_SECRET
    );

    const res = await request(app)
      .patch("/request/REQ001/approval")
      .set("Authorization", `Bearer ${token}`);

    expect(res.statusCode).toBe(403);
    expect(res.body.errors[0].code).toBe("E-006");
  });

  test("checkRole berhasil untuk Kasubbag TURT", async () => {
    const token = jwt.sign(
      { id: 1, role: "Kasubbag TURT" },
      process.env.JWT_SECRET
    );

    const res = await request(app)
      .patch("/request/REQ001/approval")
      .set("Authorization", `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe("Approval granted");
  });

  test("checkRole berhasil untuk Pengelola BMN di endpoint finish", async () => {
    const token = jwt.sign(
      { id: 2, role: "Pengelola BMN" },
      process.env.JWT_SECRET
    );

    const res = await request(app)
      .patch("/request/REQ001/finish")
      .set("Authorization", `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe("Request finished");
  });
});

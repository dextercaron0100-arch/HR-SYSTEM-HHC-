import { NextRequest } from "next/server";
import { testEmployees } from "@/lib/test-employees";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { employeeCode?: string; password?: string };
    const { employeeCode, password } = body;

    if (!employeeCode || !password) {
      return Response.json(
        { message: "Employee code and password are required." },
        { status: 400 }
      );
    }

    const employee = testEmployees.find(
      (e) => e.employeeCode.toLowerCase() === employeeCode.trim().toLowerCase()
    );

    if (!employee || employee.password !== password) {
      return Response.json(
        { message: "Invalid employee code or password." },
        { status: 401 }
      );
    }

    // Build a simple JWT-like token (base64 payload — no external dependency needed)
    const payload = {
      sub: employee.id,
      employeeCode: employee.employeeCode,
      role: employee.role,
      firstName: employee.firstName,
      lastName: employee.lastName,
      email: employee.email,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 43200 // 12 hours
    };

    const token = Buffer.from(JSON.stringify(payload)).toString("base64url");

    return Response.json({
      accessToken: token,
      user: {
        id: employee.id,
        employeeCode: employee.employeeCode,
        firstName: employee.firstName,
        lastName: employee.lastName,
        email: employee.email,
        role: employee.role,
        departmentId: employee.departmentId,
        positionId: employee.positionId
      }
    });
  } catch {
    return Response.json(
      { message: "Internal server error." },
      { status: 500 }
    );
  }
}

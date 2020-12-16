import { generateInterface } from "../generateInterface";

describe("Interface Generator", () => {
  it("Change Interface Name", () => {
    const name = "MyTestInterface";
    const expectResult = `interface ${name} {\n}\n`;
    const result = generateInterface({ name, schemas: {} });
    expect(result).toBe(expectResult);
  });
});

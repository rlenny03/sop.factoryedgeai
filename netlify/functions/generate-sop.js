import OpenAI from "openai";

export const handler = async (event) => {
  try {
    const { sop_title, sop_industry, sop_process, sop_site } = JSON.parse(event.body);

    const prompt = `
Generate a Standard Operating Procedure (SOP) in a clean professional format.

Title: ${sop_title}
Industry: ${sop_industry || "Not specified"}
Process/Machine: ${sop_process || "Not specified"}
Site/Department: ${sop_site || "Not specified"}

Include:
- Purpose
- Scope
- Responsibilities
- Required PPE/Equipment
- Safety Precautions
- Step-by-Step Procedure
- Documentation/Records
- References
- Revision History

Make it clear, business-ready, and detailed enough that it could be directly used in a real company.
    `;

    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.4,
    });

    const sop = response.choices[0].message.content;

    return {
      statusCode: 200,
      body: JSON.stringify({ sop }),
    };
  } catch (e) {
    console.error("SOP generation error:", e);
    return { statusCode: 500, body: JSON.stringify({ error: "SOP generation failed" }) };
  }
};

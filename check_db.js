import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const url = process.env.VITE_SUPABASE_URL;
const key = process.env.VITE_SUPABASE_ANON_KEY;

if (!url || !key) {
    console.error("Missing credentials");
    process.exit(1);
}

const supabase = createClient(url, key);

async function test() {
    console.log("Testing connection to 'companies'...");
    const { data, error } = await supabase.from("companies").select("*").limit(1);

    if (error) {
        console.error("❌ DB Error:", error);
    } else {
        console.log("✅ DB Success. Data:", data);
    }
}

test();

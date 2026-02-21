import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { addSupervisor } from "../lib/api/supervisors";

async function run() {
    try {
        const result = await addSupervisor({
            name: "Test Node Supervisor",
            email: "node.sup@test.com",
            phone: "+123"
        });
        console.log("Success:", result);
    } catch (e) {
        console.error("Failure:", e);
    }
}

run();

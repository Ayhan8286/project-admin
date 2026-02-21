// Temporary script to bulk-fix UK times for ALL classes in the database.
// Usage: node scripts/fix-uk-times.mjs
// PKT = UTC+5, UKT = UTC+0 → subtract 5 hours from PK time

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Load env from .env.local, .env, etc.
config({ path: '.env.local' });
config({ path: '.env' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY');
    console.log('   Available env vars:', Object.keys(process.env).filter(k => k.includes('SUPABASE')));
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

function convertPkToUk(pkTime) {
    if (!pkTime || !pkTime.trim()) return null;
    const match = pkTime.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
    if (!match) return null;
    let hours = parseInt(match[1], 10);
    const minutes = match[2];
    const period = match[3].toUpperCase();

    if (period === 'PM' && hours !== 12) hours += 12;
    if (period === 'AM' && hours === 12) hours = 0;

    hours -= 5;
    if (hours < 0) hours += 24;

    const ukPeriod = hours >= 12 ? 'PM' : 'AM';
    let displayH = hours % 12;
    if (displayH === 0) displayH = 12;

    return `${displayH}:${minutes} ${ukPeriod}`;
}

async function main() {
    console.log('📡 Fetching all classes...');
    const { data: classes, error } = await supabase
        .from('classes')
        .select('id, pak_start_time, pak_end_time, uk_start_time, uk_end_time, student_id');

    if (error) {
        console.error('❌ Error fetching classes:', error);
        process.exit(1);
    }

    console.log(`📊 Found ${classes.length} total classes`);

    let fixed = 0;
    let skipped = 0;
    let unparseable = 0;

    for (const cls of classes) {
        const computedUkStart = convertPkToUk(cls.pak_start_time);
        const computedUkEnd = convertPkToUk(cls.pak_end_time);

        if (!computedUkStart || !computedUkEnd) {
            console.log(`  ⚠️  ID ${cls.id} — PK times not parseable: "${cls.pak_start_time}" → "${cls.pak_end_time}"`);
            unparseable++;
            continue;
        }

        const needsFix = !cls.uk_start_time || !cls.uk_end_time ||
            cls.uk_start_time !== computedUkStart || cls.uk_end_time !== computedUkEnd;

        if (needsFix) {
            const oldUk = `${cls.uk_start_time || '(empty)'} – ${cls.uk_end_time || '(empty)'}`;
            const newUk = `${computedUkStart} – ${computedUkEnd}`;
            console.log(`  ✏️  ID ${cls.id} — UK: ${oldUk} → ${newUk}  (PK: ${cls.pak_start_time}–${cls.pak_end_time})`);

            const { error: updateError } = await supabase
                .from('classes')
                .update({
                    uk_start_time: computedUkStart,
                    uk_end_time: computedUkEnd,
                })
                .eq('id', cls.id);

            if (updateError) {
                console.error(`  ❌ Failed to update ${cls.id}:`, updateError);
            } else {
                fixed++;
            }
        } else {
            skipped++;
        }
    }

    console.log('\n════════════════════════════════');
    console.log(`✅ Fixed:       ${fixed}`);
    console.log(`⏭️  Already OK:  ${skipped}`);
    console.log(`⚠️  Unparseable: ${unparseable}`);
    console.log(`📊 Total:       ${classes.length}`);
    console.log('════════════════════════════════');
}

main().catch(console.error);

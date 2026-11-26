//! Wall-clock helpers without external crates. Times are stored as Unix
//! seconds; the shop's UTC offset (Kabul is +4:30) turns them into local dates.

use std::time::{SystemTime, UNIX_EPOCH};

pub fn now() -> i64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_secs() as i64)
        .unwrap_or(0)
}

pub struct Local {
    pub year: i64,
    pub month: u32,
    pub day: u32,
    pub hour: u32,
    pub minute: u32,
    /// 0 = Sunday
    pub weekday: u32,
}

/// Convert days since 1970-01-01 to a civil date (Howard Hinnant's algorithm).
fn civil(days: i64) -> (i64, u32, u32) {
    let z = days + 719_468;
    let era = if z >= 0 { z } else { z - 146_096 } / 146_097;
    let doe = z - era * 146_097;
    let yoe = (doe - doe / 1460 + doe / 36_524 - doe / 146_096) / 365;
    let y = yoe + era * 400;
    let doy = doe - (365 * yoe + yoe / 4 - yoe / 100);
    let mp = (5 * doy + 2) / 153;
    let d = (doy - (153 * mp + 2) / 5 + 1) as u32;
    let m = if mp < 10 { mp + 3 } else { mp - 9 } as u32;
    (if m <= 2 { y + 1 } else { y }, m, d)
}

pub fn local(epoch: i64, offset_min: i64) -> Local {
    let t = epoch + offset_min * 60;
    let days = t.div_euclid(86_400);
    let secs = t.rem_euclid(86_400);
    let (year, month, day) = civil(days);
    Local {
        year,
        month,
        day,
        hour: (secs / 3600) as u32,
        minute: ((secs % 3600) / 60) as u32,
        weekday: (days + 4).rem_euclid(7) as u32,
    }
}

/// `YYYY-MM-DD` in shop time.
pub fn day_key(epoch: i64, offset_min: i64) -> String {
    let l = local(epoch, offset_min);
    format!("{:04}-{:02}-{:02}", l.year, l.month, l.day)
}

pub fn time_hm(epoch: i64, offset_min: i64) -> String {
    let l = local(epoch, offset_min);
    format!("{:02}:{:02}", l.hour, l.minute)
}

/// e.g. `Thu 26 Nov 2026`
pub fn date_long(epoch: i64, offset_min: i64) -> String {
    const WD: [&str; 7] = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const MO: [&str; 12] = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    let l = local(epoch, offset_min);
    format!("{} {} {} {}", WD[l.weekday as usize], l.day, MO[(l.month - 1) as usize], l.year)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn kabul_dates() {
        // 2026-11-26 08:16 UTC is 12:46 in Kabul (UTC+4:30), a Thursday.
        let t = 1_795_680_960;
        assert_eq!(day_key(t, 270), "2026-11-26");
        assert_eq!(time_hm(t, 270), "12:46");
        assert_eq!(date_long(t, 270), "Thu 26 Nov 2026");
        // 20:00 UTC on the 26th is already the 27th in Kabul.
        assert_eq!(day_key(1_795_723_200, 270), "2026-11-27");
    }
}

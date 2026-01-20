import { parse, format, add, startOfDay, setHours, setMinutes } from 'date-fns';
import { zonedTimeToUtc, utcToZonedTime } from 'date-fns-tz';

const DEFAULT_TIMEZONE = process.env.DEFAULT_TIMEZONE || 'Asia/Kolkata';

export const normalizeDatePhrase = (datePhrase, timezone = DEFAULT_TIMEZONE) => {
    if (!datePhrase) return null;
    try {
        const now = utcToZonedTime(new Date(), timezone);
        const phrase = datePhrase.toLowerCase().trim();
        let targetDate = null;

        if (phrase.includes('today')) targetDate = startOfDay(now);
        else if (phrase.includes('tomorrow')) targetDate = add(startOfDay(now), { days: 1 });
        else if (phrase.includes('day after tomorrow')) targetDate = add(startOfDay(now), { days: 2 });
        else if (phrase.includes('next')) {
            const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
            const dayMatch = days.find(day => phrase.includes(day));
            if (dayMatch) {
                const targetDayIndex = days.indexOf(dayMatch);
                const currentDayIndex = now.getDay();
                let daysToAdd = targetDayIndex - currentDayIndex;
                if (daysToAdd <= 0) daysToAdd += 7;
                targetDate = add(startOfDay(now), { days: daysToAdd });
            }
        } else {
            const formats = ['yyyy-MM-dd', 'dd/MM/yyyy', 'MM/dd/yyyy', 'MMM dd, yyyy'];
            for (const f of formats) {
                try {
                    const parsed = parse(datePhrase, f, now);
                    if (parsed && !isNaN(parsed.getTime())) { targetDate = parsed; break; }
                } catch (e) { }
            }
        }

        if (targetDate) return { date: format(targetDate, 'yyyy-MM-dd'), datetime: targetDate };
        return null;
    } catch (error) {
        return null;
    }
};

export const normalizeTimePhrase = (timePhrase) => {
    if (!timePhrase) return null;
    try {
        const phrase = timePhrase.toLowerCase().trim();
        let hours = 0, minutes = 0;

        const time24Match = phrase.match(/(\d{1,2}):(\d{2})/);
        if (time24Match) {
            hours = parseInt(time24Match[1]);
            minutes = parseInt(time24Match[2]);
        } else {
            const time12Match = phrase.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)/);
            if (time12Match) {
                hours = parseInt(time12Match[1]);
                minutes = time12Match[2] ? parseInt(time12Match[2]) : 0;
                if (time12Match[3] === 'pm' && hours !== 12) hours += 12;
                else if (time12Match[3] === 'am' && hours === 12) hours = 0;
            }
        }

        if (hours >= 0 && hours < 24 && minutes >= 0 && minutes < 60) {
            return { time: `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`, hours, minutes };
        }
        return null;
    } catch (error) {
        return null;
    }
};

export const normalizeEntities = (entities, timezone = DEFAULT_TIMEZONE) => {
    const dateInfo = normalizeDatePhrase(entities.date_phrase, timezone);
    const timeInfo = normalizeTimePhrase(entities.time_phrase);

    let datetime = null;
    if (dateInfo && timeInfo) {
        try {
            let dt = dateInfo.datetime;
            dt = setHours(dt, timeInfo.hours);
            dt = setMinutes(dt, timeInfo.minutes);
            datetime = zonedTimeToUtc(dt, timezone).toISOString();
        } catch (e) { }
    }

    return {
        date: dateInfo?.date || null,
        time: timeInfo?.time || null,
        datetime,
        department: entities.department,
        timezone,
    };
};

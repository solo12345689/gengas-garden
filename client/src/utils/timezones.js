export function countryLocalTime(timezone){ if(!timezone) return ''; try{ return new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit', timeZone: timezone}); }catch(e){ return ''; } }

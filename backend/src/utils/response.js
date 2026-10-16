// One success shape for the whole API: { success: true, data, meta? }.
export const ok = (res, data, meta) => res.status(200).json({ success: true, data, ...(meta && { meta }) });
export const created = (res, data) => res.status(201).json({ success: true, data });

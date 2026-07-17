
CREATE OR REPLACE FUNCTION public.get_professional_availability(_id uuid, _start date, _end date)
RETURNS TABLE(day date, status text)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _d date;
  _dow int;
  _has_sched boolean;
  _full_block boolean;
  _total_slots int;
  _booked_slots int;
  _sched RECORD;
  _cur time;
  _end_t time;
  _slot_dur int;
  _step interval;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.professionals WHERE id = _id AND active = true AND show_on_landing = true) THEN
    RETURN;
  END IF;

  _d := _start;
  WHILE _d <= _end LOOP
    _dow := EXTRACT(DOW FROM _d)::int;

    SELECT EXISTS (
      SELECT 1 FROM public.professional_schedules
      WHERE professional_id = _id AND day_of_week = _dow AND active = true
    ) INTO _has_sched;

    IF NOT _has_sched THEN
      day := _d; status := 'off'; RETURN NEXT;
    ELSE
      SELECT EXISTS (
        SELECT 1 FROM public.schedule_blocks
        WHERE professional_id = _id AND block_date = _d AND is_full_day = true
      ) INTO _full_block;

      IF _full_block THEN
        day := _d; status := 'unavailable'; RETURN NEXT;
      ELSE
        _total_slots := 0;
        FOR _sched IN
          SELECT start_time, end_time, slot_duration_minutes
          FROM public.professional_schedules
          WHERE professional_id = _id AND day_of_week = _dow AND active = true
        LOOP
          _cur := _sched.start_time;
          _end_t := _sched.end_time;
          _slot_dur := COALESCE(_sched.slot_duration_minutes, 30);
          _step := make_interval(mins => _slot_dur);
          WHILE _cur + _step <= _end_t LOOP
            _total_slots := _total_slots + 1;
            _cur := _cur + _step;
          END LOOP;
        END LOOP;

        SELECT COUNT(*) INTO _booked_slots
        FROM public.appointments
        WHERE professional_id = _id
          AND appointment_date = _d
          AND status NOT IN ('cancelado','faltou');

        IF _total_slots > 0 AND _booked_slots >= _total_slots THEN
          day := _d; status := 'unavailable'; RETURN NEXT;
        ELSE
          day := _d; status := 'available'; RETURN NEXT;
        END IF;
      END IF;
    END IF;

    _d := _d + 1;
  END LOOP;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_professional_availability(uuid, date, date) TO anon, authenticated;

-- Historial permanente: reemplazar el UUID por el del estudiante autorizado.
SELECT
  e.id AS id_evento,
  e."studentId" AS estudiante_id,
  e."routineTitle" AS rutina,
  e."taskTitle" AS actividad,
  e."activityDate" AS fecha_actividad,
  CASE WHEN e.completed THEN 'Completada' ELSE 'Desmarcada' END AS cambio,
  e."recordedAt" AT TIME ZONE 'America/Guayaquil' AS fecha_hora_registro
FROM public.task_activity_events AS e
WHERE e."studentId" = '00000000-0000-0000-0000-000000000000'::uuid
ORDER BY e."recordedAt" DESC, e.id DESC;

-- Estado actual por día (no es un historial de cambios).
SELECT
  c.id AS id_registro,
  u.full_name AS estudiante,
  r.title AS rutina,
  t.title AS actividad,
  c."activityDate" AS fecha_actividad,
  CASE WHEN c.completed THEN 'Completada' ELSE 'Pendiente' END AS estado,
  c."completedAt" AT TIME ZONE 'America/Guayaquil' AS fecha_hora_completada,
  c."createdAt" AT TIME ZONE 'America/Guayaquil' AS fecha_registro
FROM public.task_completions AS c
JOIN public.users AS u ON u.id = c."studentId"
JOIN public.tasks AS t ON t.id = c."taskId"
JOIN public.routines AS r ON r.id = t."routineId"
ORDER BY c."activityDate" DESC, c."createdAt" DESC, c.id;

-- Primeiro, removemos a função existente para evitar erro de mudança de tipo de retorno
DROP FUNCTION IF EXISTS public.exec_sql(text);

-- Recriamos a função com a lógica correta e suporte a janelas de busca seguras
CREATE OR REPLACE FUNCTION public.exec_sql(sql_query text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_catalog', 'information_schema', 'auth', 'storage'
AS $$
DECLARE
  result json;
  caller_role text;
  clean_query text;
BEGIN
  -- Apenas permitimos a execução se o papel for service_role
  -- Nota: Em contextos de Edge Functions com a chave de serviço, o papel é service_role
  caller_role := current_setting('request.jwt.claims', true)::json->>'role';
  
  -- Se não houver JWT (execução direta via console ou trigger interna segura), validamos se é service_role local
  IF caller_role IS NULL THEN
    caller_role := current_user;
  END IF;

  IF caller_role IS DISTINCT FROM 'service_role' AND current_user IS DISTINCT FROM 'service_role' THEN
    RAISE EXCEPTION 'Acesso negado: apenas service_role pode executar esta função.';
  END IF;

  clean_query := rtrim(sql_query, '; ');
  
  -- Encapsulamos a query para garantir que o retorno seja sempre um JSON Array
  EXECUTE 'SELECT json_agg(row_to_json(t)) FROM (' || clean_query || ') t' INTO result;
  
  RETURN COALESCE(result, '[]'::json);
END;
$$;

-- Garantimos permissões apenas para a role de serviço
GRANT EXECUTE ON FUNCTION public.exec_sql(text) TO service_role;

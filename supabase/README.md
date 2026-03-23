# Supabase Type Generation (gen types)

이 프로젝트는 Supabase 스키마 타입을 `supabase gen types`로 생성한 뒤, `lib/supabase/database.types.ts`의 `Database` 타입으로 연결하는 방식을 사용합니다.

## 1. 준비

```bash
supabase login
supabase link --project-ref <project-ref>
```

## 2. 타입 생성 (public 스키마 기준)

```bash
supabase gen types typescript --linked --schema=public > lib/supabase/database.types.ts
```

## 3. 주의 사항

- Supabase CLI로 생성한 파일이 기존의 placeholder를 덮어씁니다.
- `lib/supabase/client.ts` / `server.ts`는 `Database` 제네릭을 사용하므로, 타입이 생성되면 쿼리 결과에 자동 완성이 적용됩니다.


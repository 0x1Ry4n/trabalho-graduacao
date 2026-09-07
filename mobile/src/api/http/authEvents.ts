/**
 * Ponte entre a camada de transporte e a camada de estado.
 *
 * O interceptor precisa avisar o app quando a sessão morre em definitivo, mas
 * não pode decidir o que fazer a respeito: a versão anterior chamava
 * `router.replace('/(auth)/login')` de dentro do interceptor, acoplando a
 * camada de API ao expo-router e violando a separação UI / serviços de API /
 * estado exigida por `.claude/rules.md`.
 *
 * Aqui o interceptor apenas emite o evento; `src/store/auth.store.ts` assina e
 * executa o logout e a navegação.
 */

export type AuthEvent = 'session:expired';

type Listener = () => void;

const listeners = new Map<AuthEvent, Set<Listener>>();

export const authEvents = {
    /** Registra um ouvinte e devolve a função de cancelamento. */
    on(event: AuthEvent, listener: Listener): () => void {
        const current = listeners.get(event) ?? new Set<Listener>();

        current.add(listener);
        listeners.set(event, current);

        return () => {
            current.delete(listener);
        };
    },

    emit(event: AuthEvent): void {
        listeners.get(event)?.forEach((listener) => {
            try {
                listener();
            } catch (error) {
                // Um ouvinte com defeito não pode impedir os demais de rodarem
                // nem derrubar a cadeia de interceptors.
                if (__DEV__) {
                    console.error(`[authEvents] Falha no ouvinte de "${event}":`, error);
                }
            }
        });
    },
};

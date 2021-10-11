import TelegrafSessionLocal from 'telegraf-session-local';
const session = new TelegrafSessionLocal({ database: 'db.json' });
const db = (session as any).DB

const getUsers = () => db.get('sessions').map((i: any) => ({
    ...(i.data || null),
    id: i.id
})).value();

export { session, db, getUsers }
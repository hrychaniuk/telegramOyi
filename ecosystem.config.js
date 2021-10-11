module.exports = {
	apps: [
		{
			name: 'portal_bot',
            script: 'npm',
            args: 'run start',
			exec_mode: 'cluster',
			instances: 1,
		},
	],
};
import { flags } from '@oclif/command'

import { Device, DeviceListOptions } from '@smartthings/core-sdk'

import { APICommand, outputListing, withLocationsAndRooms } from '@smartthings/cli-lib'

import { buildTableOutput } from '../lib/commands/devices/devices-util'


export default class DevicesCommand extends APICommand {
	static description = 'list all devices available in a user account or retrieve a single device'

	static flags = {
		...APICommand.flags,
		...outputListing.flags,
		'location-id': flags.string({
			char: 'l',
			description: 'filter results by location',
			multiple: true,
		}),
		capability: flags.string({
			char: 'c',
			description: 'filter results by capability',
			multiple: true,
		}),
		'capabilities-mode': flags.string({
			char: 'C',
			description: 'Treat capability filter query params as a logical "or" or "and" with a default of "and".',
			dependsOn: ['capability'],
			options: ['and', 'or'],
		}),
		'device-id': flags.string({
			char: 'd',
			description: 'filter results by device',
			multiple: true,
		}),
		'installed-app-id': flags.string({
			char: 'a',
			description: 'filter results by installed app that created the device',
		}),
		verbose: flags.boolean({
			description: 'include location name in output',
			char: 'v',
		}),
	}

	static args = [{
		name: 'id',
		description: 'device to retrieve; UUID or the number of the device from list',
	}]

	async run(): Promise<void> {
		const { args, argv, flags } = this.parse(DevicesCommand)
		await super.setup(args, argv, flags)

		const config = {
			primaryKeyName: 'deviceId',
			sortKeyName: 'label',
			listTableFieldDefinitions: ['label', 'name', 'type', 'deviceId'],
			buildTableOutput: (data: Device) => buildTableOutput(this.tableGenerator, data),
		}
		if (this.flags.verbose) {
			config.listTableFieldDefinitions.splice(3, 0, 'location', 'room')
		}

		const deviceListOptions: DeviceListOptions = {
			capability: flags.capability,
			capabilitiesMode: flags['capabilities-mode'] === 'or' ? 'or' : 'and',
			locationId: flags['location-id'],
			deviceId: flags['device-id'],
			installedAppId: flags['installed-app-id'],
		}

		await outputListing(this, config, args.id,
			async () => {
				const devices = await this.client.devices.list(deviceListOptions)
				if (flags.verbose) {
					return await withLocationsAndRooms(this.client, devices)
				}
				return devices
			},
			id => this.client.devices.get(id),
		)
	}
}

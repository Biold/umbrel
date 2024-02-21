import {matchSorter} from 'match-sorter'
import {ReactNode, useEffect, useRef, useState} from 'react'
import {TbChevronLeft} from 'react-icons/tb'

import {ChevronDown} from '@/assets/chevron-down'
import {AppIcon} from '@/components/app-icon'
import {
	ImmersiveDialog,
	ImmersiveDialogContent,
	ImmersiveDialogFooter,
	immersiveDialogTitleClass,
} from '@/components/ui/immersive-dialog'
import {SegmentedControl} from '@/components/ui/segmented-control'
import {UmbrelHeadTitle} from '@/components/umbrel-head-title'
import {LOADING_DASH} from '@/constants'
import {useLocalStorage2} from '@/hooks/use-local-storage2'
import {useApps, useUserApp} from '@/providers/apps'
import {Button} from '@/shadcn-components/ui/button'
import {
	DropdownMenu,
	DropdownMenuCheckboxItem,
	DropdownMenuContent,
	DropdownMenuTrigger,
} from '@/shadcn-components/ui/dropdown-menu'
import {Input} from '@/shadcn-components/ui/input'
import {ScrollArea} from '@/shadcn-components/ui/scroll-area'
import {cn} from '@/shadcn-lib/utils'
import {trpcReact} from '@/trpc/trpc'
import {useDialogOpenProps} from '@/utils/dialog'
import {t} from '@/utils/i18n'
import {tw} from '@/utils/tw'

type TroubleshootType = 'NONE' | 'system' | 'app'

export default function TroubleshootDialog() {
	const dialogProps = useDialogOpenProps('troubleshoot')

	return (
		<ImmersiveDialog {...dialogProps}>
			<Content />
		</ImmersiveDialog>
	)
}

function Content() {
	const initialTitle = t('troubleshoot-pick-title')
	const [troubleshootType, setTroubleshootType] = useLocalStorage2<TroubleshootType>('troubleshoot-type')
	const [appId, setAppId] = useLocalStorage2<string>('troubleshoot-app-active-tab', 'NONE')
	const [appDialogOpen, setAppDialogOpen] = useState(false)

	const handleBack = () => {
		setTroubleshootType('NONE')
		setAppId('NONE')
		setAppDialogOpen(false)
	}

	if (troubleshootType === 'system') {
		return (
			<ImmersiveDialogContent>
				<TroubleshootSystem onBack={handleBack} />
			</ImmersiveDialogContent>
		)
	} else if (troubleshootType === 'app' && appId && appId !== 'NONE') {
		return (
			<ImmersiveDialogContent>
				<TroubleshootApp appId={appId} setAppId={setAppId} onBack={handleBack} />
			</ImmersiveDialogContent>
		)
	} else {
		return (
			<ImmersiveDialogContent short>
				<UmbrelHeadTitle>{initialTitle}</UmbrelHeadTitle>
				<h1 className={cn(immersiveDialogTitleClass, '-mt-1 text-19')}>{initialTitle}</h1>
				<div className='flex flex-col gap-2.5'>
					<button className={radioButtonClass} onClick={() => setTroubleshootType('system')}>
						<div>
							<div className={radioTitleClass}>umbrelOS</div>
							<div className={radioDescriptionClass}>Get Umbrel Logs and DMESG Logs for your umbrelOS</div>
						</div>
					</button>
					<button className={radioButtonClass} onClick={() => setAppDialogOpen(true)}>
						<div>
							<div className={radioTitleClass}>Specific application...</div>
							<div className={radioDescriptionClass}>Get logs for an app installed on your Umbrel</div>
						</div>
						<DropdownMenu open={appDialogOpen} onOpenChange={setAppDialogOpen}>
							<TroubleshootDropdown
								open={appDialogOpen}
								onOpenChange={setAppDialogOpen}
								appId={appId === 'NONE' ? undefined : appId}
								setAppId={(id) => {
									setAppId(id)
									setTroubleshootType('app')
								}}
							/>
						</DropdownMenu>
					</button>
				</div>
			</ImmersiveDialogContent>
		)
	}
}

const radioButtonClass = tw`rounded-12 bg-white/5 p-5 text-left flex justify-between items-center shadow-button-highlight-soft-hpx outline-none duration-300 hover:bg-white/6 transition-colors focus-visible:ring-4 ring-white/5 focus-visible:ring-offset-1 ring-offset-white/20`
const radioTitleClass = tw`text-15 font-medium -tracking-2`
const radioDescriptionClass = tw`text-13 opacity-90 -tracking-2`

function TroubleshootSystem({onBack}: {onBack: () => void}) {
	const title = t('troubleshoot')

	const tabs = [
		{id: 'umbrel', label: t('troubleshoot.umbrel-logs')},
		{id: 'dmesg', label: t('troubleshoot.dmesg-logs')},
	]
	const [activeTab, setActiveTab] = useLocalStorage2('troubleshoot-system-active-tab', tabs[0].id)

	const activeLabel = tabs.find((tab) => tab.id === activeTab)?.label

	return (
		<div className='flex max-h-full flex-1 flex-col items-start gap-4'>
			<UmbrelHeadTitle>{title}</UmbrelHeadTitle>
			<div className='flex w-full items-center justify-between'>
				<button
					onClick={() => onBack()}
					className='flex items-center rounded-full outline-none ring-white ring-offset-black focus-visible:ring-2 focus-visible:ring-offset-4'
				>
					<TbChevronLeft className='size-6 opacity-50' />
					<h1 className={cn(immersiveDialogTitleClass, '-mt-1 text-19')}>{title}</h1>
				</button>
				<SegmentedControl size='lg' tabs={tabs} value={activeTab} onValueChange={setActiveTab} />
			</div>
			<LogResults>
				{'Exercitation cupidatat officia labore exercitation reprehenderit non elit dolore eiusmod enim in ut sunt labore. Sint laborum aliqua irure enim sit pariatur aute ea aliquip labore. Amet occaecat culpa do duis sit cillum. Commodo magna ipsum ullamco laboris dolor aute anim sint veniam quis sunt. Enim aliqua cillum excepteur aute laborum reprehenderit cillum fugiat culpa consequat ut. Pariatur ut ex irure mollit velit ad adipisicing proident sint officia quis aliqua consectetur. Veniam et Lorem aliquip reprehenderit dolore occaecat duis ut nostrud reprehenderit voluptate excepteur adipisicing labore.\n'.repeat(
					50,
				)}
			</LogResults>
			<ImmersiveDialogFooter className='justify-center'>
				<Button variant='primary' size='dialog'>
					{t('troubleshoot.system-download', {label: activeLabel})}
				</Button>
				<Button size='dialog'>{t('troubleshoot.share-with-umbrel-support')}</Button>
			</ImmersiveDialogFooter>
		</div>
	)
}

function TroubleshootApp({
	appId,
	setAppId,
	onBack,
}: {
	appId: string
	setAppId: (id: string) => void
	onBack: () => void
}) {
	const title = t('troubleshoot')
	const {app} = useUserApp(appId)
	const [open, setOpen] = useState(false)

	return (
		<div className='flex max-h-full flex-1 flex-col items-start gap-4'>
			<UmbrelHeadTitle>{title}</UmbrelHeadTitle>
			<div className='flex w-full items-center justify-between'>
				<button
					onClick={() => onBack()}
					className='flex items-center rounded-full outline-none ring-white ring-offset-black focus-visible:ring-2 focus-visible:ring-offset-4'
				>
					<TbChevronLeft className='size-6 opacity-50' />
					<h1 className={cn(immersiveDialogTitleClass, '-mt-1 text-19')}>{title}</h1>
				</button>
				<DropdownMenu open={open} onOpenChange={setOpen}>
					<TroubleshootDropdown appId={appId} setAppId={setAppId} open={open} onOpenChange={setOpen} />
				</DropdownMenu>
			</div>
			{appId && <LogResults>{<AppResults appId={appId} />}</LogResults>}
			<ImmersiveDialogFooter>
				<Button variant='primary' size='dialog'>
					{t('troubleshoot.app-download', {app: app?.name || LOADING_DASH})}
				</Button>
				<Button size='dialog'>{t('troubleshoot.share-with-umbrel-support')}</Button>
			</ImmersiveDialogFooter>
		</div>
	)
}

function AppResults({appId}: {appId: string}) {
	const troubleshootQ = trpcReact.apps.logs.useQuery(
		{appId},
		{
			refetchInterval: 1000 * 2,
		},
	)

	if (troubleshootQ.isLoading) return t('loading') + '...'
	if (troubleshootQ.isError) return troubleshootQ.error.message

	return troubleshootQ.data
}

function useScrollToBottom(ref: React.RefObject<HTMLDivElement>) {
	useEffect(() => {
		setTimeout(() => {
			if (ref.current) {
				ref.current.scrollTop = ref.current.scrollHeight + 100
			}
		}, 500)
	}, [ref])
}

function LogResults({children}: {children: ReactNode}) {
	const ref = useRef<HTMLDivElement>(null)
	useScrollToBottom(ref)

	return (
		<div
			ref={ref}
			className='w-full flex-1 overflow-auto whitespace-pre rounded-10 bg-black px-5 py-4 font-mono text-white/50'
		>
			{children}
			{/* Keeps scroll pinned to bottom */}
			<div style={{overflowAnchor: 'auto'}} />
		</div>
	)
}

function TroubleshootDropdown({
	appId,
	setAppId,
	open,
	onOpenChange,
}: {
	appId?: string
	setAppId: (id: string) => void
	open: boolean
	onOpenChange: (o: boolean) => void
}) {
	const [query, setQuery] = useState('')
	const apps = useApps()
	// const [open, setOpen] = useState(false)
	const inputRef = useRef<HTMLInputElement>(null)

	useEffect(() => {
		if (!open) return
		setTimeout(() => {
			inputRef.current?.focus()
			inputRef.current?.select()
		}, 0)
	}, [open])

	if (apps.isLoading || !apps.userApps || !apps.userAppsKeyed) {
		return (
			<Button className='h-[36px] min-w-36 px-3'>
				<AppIcon size={20} className='rounded-4' />
				{LOADING_DASH}
				<ChevronDown />
			</Button>
		)
	}

	const selectedApp = appId
		? apps.userAppsKeyed[appId]
		: {
				icon: undefined,
				name: 'Select app...',
		  }

	const appResults = matchSorter(apps.userApps, query, {
		keys: ['name'],
		threshold: matchSorter.rankings.WORD_STARTS_WITH,
	})

	return (
		// TODO: convert to combobox: https://ui.shadcn.com/docs/components/combobox
		// <DropdownMenu open={open} onOpenChange={setOpen}>
		<>
			<DropdownMenuTrigger asChild>
				<Button className='h-[36px] min-w-36 px-3'>
					<span className='flex flex-1 flex-row items-center gap-2'>
						{selectedApp.icon && <AppIcon size={20} src={selectedApp.icon} className='rounded-4' />}
						{selectedApp.name}
					</span>
					<ChevronDown />
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent className='flex max-h-72 min-w-64 flex-col gap-3' align='start'>
				<Input
					value={query}
					className='shrink-0'
					onChange={(e) => setQuery(e.target.value)}
					onKeyDown={(e) => {
						// Prevent key presses from triggering stuff in the dropdown menu
						e.stopPropagation()
						if (e.key === 'Enter') {
							setAppId(appResults[0].id)
							setQuery('')
							onOpenChange(false)
						}
						if (e.key === 'Escape') {
							setQuery('')
							onOpenChange(false)
						}
					}}
					sizeVariant={'short-square'}
					placeholder='Search...'
					ref={inputRef}
				/>
				{appResults.length === 0 && <div className='text-14 text-white/50'>{t('no-results-found')}</div>}
				{appResults.length > 0 && (
					<ScrollArea className='relative -mx-2.5 flex h-full flex-col px-2.5'>
						{appResults.map((app, i) => (
							<DropdownMenuCheckboxItem
								key={app.id}
								checked={app.id === appId}
								onSelect={() => setAppId(app.id)}
								className='flex gap-2'
								data-highlighted={i === 0 && query ? true : undefined}
							>
								<AppIcon size={20} src={app.icon} className='rounded-4 bg-white/10' />
								{app.name}
							</DropdownMenuCheckboxItem>
						))}
					</ScrollArea>
				)}
			</DropdownMenuContent>
		</>
		// </DropdownMenu>
	)
}

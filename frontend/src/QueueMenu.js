import React, { useState, useEffect } from 'react';
import bridge from '@vkontakte/vk-bridge';
import {
	Panel,
	PanelHeader,
	PanelHeaderBack,
	Group,
	Cell,
	List,
	Header,
	Div,
	Avatar,
	Button,
	ContentCard,
	Text,
	Title,
	ButtonGroup,
	PanelHeaderClose,
	FixedLayout,
	CellButton,
	InfoRow,
	Counter,
	Alert,
} from '@vkontakte/vkui';

import { Icon24Add, Icon16GearOutline, Icon28ArrowLeftOutline, Icon28ShuffleOutline, Icon28UserAddBadgeOutline, Icon24Delete } from '@vkontakte/icons';

import api from './api';

import '@vkontakte/vkui/dist/vkui.css';

function QueueMenu({ id, goBack, queue, isUserCreator, refreshQueues, currentUserId }) {



	const [isDeleting, setIsDeleting] = useState(false);
	const [isAlertShown, setIsAlertShown] = useState(false);





	const deleteQueue = () => {
		setIsAlertShown(true);
	};

	const confirmDeleteQueue = async () => {
		//setIsDeleting(true);
		setIsAlertShown(false);

		api.delete(`/api/queues/${queue.id}/`)
			.then((response) => {
				refreshQueues();
				goBack();
			});
	};

	const cancelDeleteQueue = () => {
		setIsAlertShown(false);
	};

	const [menuItems, setMenuItems] = useState(queue.users);


	const getTimeRemaining = (endDate) => {
		const total = Date.parse(endDate) - Date.parse(new Date());
		const seconds = Math.max(Math.floor((total / 1000) % 60), 0);
		const minutes = Math.max(Math.floor((total / 1000 / 60) % 60), 0);
		const hours = Math.max(Math.floor((total / (1000 * 60 * 60)) % 24), 0);
		const days = Math.max(Math.floor(total / (1000 * 60 * 60 * 24)), 0);

		const isTimeRemaining = total > 0; // Проверка, осталось ли время

		return {
			total,
			days,
			hours,
			minutes,
			seconds,
			isTimeRemaining, // Добавление флага для проверки оставшегося времени
		};
	};




	const [isQueueActive, setIsQueueActive] = useState(true);
	const isRecordingEnded = !getTimeRemaining(queue.endDate).isTimeRemaining; // Проверка, окончена ли запись




	useEffect(() => {
		const interval = setInterval(() => {
			if (new Date() > new Date(queue.startDate) && !isQueueActive) {
				setIsQueueActive(true);
			}
		}, 1000);
		return () => clearInterval(interval);
	}, [queue.startDate, isQueueActive]);


	const [notJoinedUsers, setNotJoinedUsers] = useState([]);

	const setUsers = () => {
		setMenuItems(queue.users.filter(user => user.position != null));
		setNotJoinedUsers(queue.users.filter(user => user.position === null));
	}

	useEffect(() => {
		setUsers();
		if (new Date() < new Date(queue.startDate)) {
			setIsQueueActive(false);
		} else {
			setIsQueueActive(true);
		}
	}, [queue.users, queue.startDate]);

	const onDragStart = (event, index) => {
		event.dataTransfer.setData('text/plain', index);
	};

	const onDragOver = (event) => {
		event.preventDefault();
	};

	const onDragEnd = (event) => {
		const draggedIndex = Number(event.dataTransfer.getData('text/plain'));
		const targetIndex = Number(event.currentTarget.dataset.index);

		if (draggedIndex !== targetIndex) {
			setMenuItems((prevItems) => {
				const newItems = [...prevItems];
				const draggedItem = newItems.splice(draggedIndex, 1)[0];
				newItems.splice(targetIndex, 0, draggedItem);
				return newItems;
			});
		}
	};
	const openModal = () => {
		console.log('Кнопка нажата');
	};

	const queueTitle = queue.title;
	const queueDescription =
		new Date() < new Date(queue.startDate)
			? `До начала: ${getTimeRemaining(queue.startDate).days}д ${getTimeRemaining(queue.startDate).hours}ч ${getTimeRemaining(queue.startDate).minutes}м ${getTimeRemaining(queue.startDate).seconds}с`
			: getTimeRemaining(queue.endDate).isTimeRemaining
				? `Осталось времени: ${getTimeRemaining(queue.endDate).days}д ${getTimeRemaining(queue.endDate).hours}ч ${getTimeRemaining(queue.endDate).minutes}м ${getTimeRemaining(queue.endDate).seconds}с`
				: <span style={{ color: 'green' }}>Запись окончена</span>; // Оберните "Запись окончена" в <span> и добавьте стиль color: 'green'


	const createInviteLink = async () => {
		const authToken = await bridge.send('VKWebAppGetAuthToken', {
			app_id: 51635364,
			scope: 'friends',
		});
		const inviteLink = `https://vk.com/app${51635364}_-_${queue.id}?access_token=${authToken.access_token}`;

		bridge.send('VKWebAppShare', {
			link: inviteLink,
		});
	};

	const joinQueue = async () => {
		const user = await bridge.send('VKWebAppGetUserInfo');

		api.post(`/api/queues/${queue.id}/move_user/`, { "user_id": currentUserId, "new_position": "end" })
			.then((response) => {
				refreshQueues();
				goBack();
				setUsers();
			});
	};

	return (
		<Panel id={id}>
			<PanelHeader before={<PanelHeaderBack onClick={goBack} />} after={<Avatar size={30} />}>
				Вочередь!
			</PanelHeader>


			<Group>
				<div style={{ display: 'flex', alignItems: 'center', padding: '12px 0' }}>
					<Avatar src={queue.avatar} size={80} style={{ marginLeft: 16 }} />
					<div style={{ marginLeft: 16 }}>
						<Title level="2" weight="semibold">
							{queueTitle}
						</Title>
						<Text weight="regular">{queueDescription}</Text>
						{!isUserCreator(queue) && (
							<ButtonGroup style={{ marginTop: 8 }}>
								<Button
									mode="commerce"
									size="m"
									before={<Icon24Add />}
									onClick={joinQueue}
									style={{
										background: '#2688EB',
										borderRadius: 12,
										color: '#FFFFFF',
										padding: '12px 16px',
										boxShadow: 'none',
										transition: 'box-shadow 0.15s ease-in-out',
									}}
									hoverMode="opacity"
									activeMode="opacity"
									disabled={!isQueueActive || isRecordingEnded} // Добавьте условие !isQueueActive || isRecordingEnded в свойство disabled
								>
									Вступить в очередь
								</Button>
							</ButtonGroup>
						)}
						{isUserCreator(queue) && (
							<ButtonGroup style={{ marginTop: 8 }}>
								<Button
									mode="commerce"
									size="m"
									before={<Icon24Add />}
									onClick={() => { }}
									style={{
										background: '#2688EB',
										borderRadius: 12,
										color: '#FFFFFF',
										padding: '12px 10px',
										boxShadow: 'none',
										transition: 'box-shadow 0.15s ease-in-out',
									}}
									hoverMode="opacity"
									activeMode="opacity"
								>
									Вступить в очередь
								</Button>
								<Button
									mode="tertiary"
									size="m"
									before={<Icon16GearOutline />}
									onClick={() => { }}
									style={{
										background: '#2688EB',
										borderRadius: 12,
										color: '#FFFFFF',
										padding: '12px 30px',
										boxShadow: 'none',
										transition: 'box-shadow 0.15s ease-in-out',
									}}
									hoverMode="opacity"
									activeMode="opacity"
								/>
								<Button
									mode="tertiary"
									size="m"
									before={<Icon24Delete />}
									onClick={deleteQueue}
									style={{
										background: '#2688EB',
										borderRadius: 12,
										color: '#FFFFFF',
										padding: '12px 30px',
										boxShadow: 'none',
										transition: 'box-shadow 0.15s ease-in-out',
									}}
									hoverMode="opacity"
									activeMode="opacity"
									disabled={isDeleting}
								/>
							</ButtonGroup>
						)}
					</div>
				</div>
			</Group>
			<Group header={<Header mode="secondary">Очередь</Header>}>
				<List>
					{menuItems.map((menuItem, index) => (
						<Cell
							key={menuItem.id}
							draggable={isUserCreator(queue)}
							onDragStart={(event) => onDragStart(event, index)}
							onDragEnd={onDragEnd}
							onDragOver={onDragOver}
							data-index={index}
							description={menuItem.description}
							before={<Avatar src={menuItem.avatar} />}
							style={{
								backgroundColor: index % 2 === 1 ? '#F0F0F0' : 'white',
							}}
						>
							<div style={{ display: 'flex', alignItems: 'center' }}>
								<div style={{ marginRight: 8 }}>{menuItem.position}.</div>
								<div>
									{menuItem.lastName} {menuItem.firstName}
								</div>
							</div>
						</Cell>
					))}
				</List>
			</Group>
			<Group header={<Header mode="secondary">Еще не вступили</Header>}>
				<List>
					{notJoinedUsers.map((user, index) => (
						<Cell
							key={user.id}
							before={<Avatar src={user.avatar} />}
							description={`Позиция: ${user.position}`}
							style={{ backgroundColor: index % 2 === 1 ? '#F0F0F0' : 'white' }}
						>
							{`${user.lastName} ${user.firstName}`}
						</Cell>
					))}
				</List>
			</Group>

			{!isUserCreator(queue) && (
				<FixedLayout vertical="bottom">
					<div
						style={{
							background: '#FFFFFF',
							height: 72,
							borderTopLeftRadius: 12,
							borderTopRightRadius: 12,
							display: 'flex',
							justifyContent: 'center',
							alignItems: 'center',
							padding: '12px 16px',
						}}
					>
						
						{isQueueActive ? (
							<Button
								mode="commerce"
								size="xl"
								style={{
									background: '#2688EB',
									borderRadius: 12,
									color: '#FFFFFF',
									padding: '12px 16px',
									flexGrow: 1,
									marginRight: 8,
									boxShadow: 'none',
									transition: 'box-shadow 0.15s ease-in-out',
								}}
								before={<Icon24Add fill="#ffffff" />}
								hoverMode="opacity"
								activeMode="opacity"
								className="queue-create-button"
								onClick={joinQueue}
								disabled={!isQueueActive || isRecordingEnded} // Добавьте условие !isQueueActive || isRecordingEnded в свойство disabled
							>
								Вступить в очередь
							</Button>
						) : (
							<Button
								mode="commerce"
								size="xl"
								style={{
									background: '#2688EB',
									borderRadius: 12,
									color: '#FFFFFF',
									padding: '12px 16px',
									flexGrow: 1,
									marginRight: 8,
									boxShadow: 'none',
									transition: 'box-shadow 0.15s ease-in-out',
								}}
								before={<Icon24Add fill="#ffffff" />}
								hoverMode="opacity"
								activeMode="opacity"
								className="queue-create-button"
								disabled
							>
								Очередь недоступна
							</Button>
						)}
													<Button
								mode="commerce"
								size="xl"
								before={<Icon28UserAddBadgeOutline fill="#ffffff" />}
								style={{
									width: 50,
									height: 50,
									borderRadius: 12,
									marginLeft: 8,
									background: '#2688EB',
								}}
								hoverMode="opacity"
								activeMode="opacity"
								onClick={createInviteLink}
							/>
					</div>
				</FixedLayout>
			)}
			{isUserCreator(queue) && (
				<FixedLayout vertical="bottom">
					<div
						style={{
							background: '#FFFFFF',
							height: 72,
							borderTopLeftRadius: 12,
							borderTopRightRadius: 12,
							display: 'flex',
							justifyContent: 'center',
							alignItems: 'center',
							padding: '12px 16px',
						}}
					>
						<Button
							mode="commerce"
							size="xl"
							style={{
								background: '#2688EB',
								borderRadius: 12,
								color: '#FFFFFF',
								padding: '12px 16px',
								flexGrow: 1,
								marginRight: 8,
								boxShadow: 'none',
								transition: 'box-shadow 0.15s ease-in-out',
							}}
							before={<Icon24Add fill="#ffffff" />}
							hoverMode="opacity"
							activeMode="opacity"
							className="queue-create-button"
							onClick={joinQueue}
						>
							Вступить в очередь
						</Button>
						<ButtonGroup>
							<Button
								mode="commerce"
								size="xl"
								before={<Icon28ShuffleOutline fill="#ffffff" />}
								style={{
									width: 50,
									height: 50,
									borderRadius: 12,
									marginLeft: 8,
									background: '#2688EB',
								}}
								hoverMode="opacity"
								activeMode="opacity"
							/>
							<Button
								mode="commerce"
								size="xl"
								before={<Icon28UserAddBadgeOutline fill="#ffffff" />}
								style={{
									width: 50,
									height: 50,
									borderRadius: 12,
									marginLeft: 8,
									background: '#2688EB',
								}}
								hoverMode="opacity"
								activeMode="opacity"
								onClick={createInviteLink}
							/>
						</ButtonGroup>
					</div>
				</FixedLayout>
			)}

			{isAlertShown && (
				<Alert
					actions={[
						{
							title: 'Удалить',
							autoclose: true,
							mode: 'destructive',
							action: confirmDeleteQueue,
						},
						{
							title: 'Отмена',
							autoclose: true,
							mode: 'cancel',
							action: cancelDeleteQueue,
						},
					]}
					onClose={cancelDeleteQueue}

					header="Вы уверены, что хотите удалить очередь?"
					text="Это действие нельзя будет отменить."
				>
				</Alert>
			)}

		</Panel>
	);
}

export default QueueMenu
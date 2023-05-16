import { React, useState, useEffect, useCallback } from 'react';
import '@vkontakte/vkui/dist/vkui.css';
import {
	Panel,
	PanelHeader,
	Placeholder,
	Button,
	ModalRoot,
	FixedLayout,
	PanelHeaderClose,
	Avatar,
	Group,
	Cell,
	Title,
	Text,
	PanelHeaderBack,
} from '@vkontakte/vkui';
import { Icon28UserAddOutline } from '@vkontakte/icons';
import Icon24Add from '@vkontakte/icons/dist/24/add';
import QueueModal from './QueueModal';
import QueueMenu from './QueueMenu';
import api from './api';
import bridge from '@vkontakte/vk-bridge';


function App() {

	const [currentUserAvatar, setCurrentUserAvatar] = useState(null);


	const [prevPanel, setPrevPanel] = useState(null);

	const [activePanel, setActivePanel] = useState("main");
	const [currentUserId, setCurrentUserId] = useState(null);
	const goToQueueMenu = () => {
		setPrevPanel(activePanel);
		setActivePanel("queueMenu");
	};

	const goBack = () => {
		setActivePanel(prevPanel);
	};


	const [modalVisible, setModalVisible] = useState(false);
	const [queues, setQueues] = useState([]);

	const [currentQueue, setCurrentQueue] = useState(null);



	const handleQueueClick = (queue) => {
		setCurrentQueue(queue);
		goToQueueMenu();
	};


	const openModal = () => {
		setModalVisible(true);
	};

	const closeModal = () => {
		setModalVisible(false);
	};

	const addQueue = (newQueue) => {

		const newQueueData = {
			name: newQueue.title,
			limit: newQueue.limit,
			start_date: newQueue.startDate.toISOString(),
			end_date: newQueue.endDate.toISOString(),
			creator_id: currentUserId,
		};
		console.log(newQueue.startDate);
		api.post(`/api/queues/`, newQueueData)
			.then((response) => {
				api.post(`/api/queues/${response.data.id}/users/`, { "user_id": currentUserId, "is_admin": true })
					.then(() => {
						refreshQueues();
					});
			});

	};
	const [timeUpdate, setTimeUpdate] = useState(0);

	useEffect(() => {
		const interval = setInterval(() => {
			setTimeUpdate((prevTime) => prevTime + 1);
		}, 1000);

		return () => clearInterval(interval);
	}, []);


	const getTimeRemaining = (endDate) => {
		const total = Date.parse(endDate) - Date.parse(new Date());
		const seconds = Math.floor((total / 1000) % 60);
		const minutes = Math.floor((total / 1000 / 60) % 60);
		const hours = Math.floor((total / (1000 * 60 * 60)) % 24);
		const days = Math.floor(total / (1000 * 60 * 60 * 24));

		return {
			total,
			days,
			hours,
			minutes,
			seconds,
		};
	};
	const renderActiveQueues = () => {
		const activeQueues = queues.filter(
			(queue) => new Date() >= new Date(queue.startDate)
		);

		if (activeQueues.length === 0) return null;

		return (
			<Group header={<Title level="3" weight="semibold">Активные очереди</Title>}>

				{activeQueues.map((queue, index) => {
					const timeRemaining = getTimeRemaining(queue.endDate);
					return (
						<Cell
							key={index}
							before={<Avatar src={queue.avatar} />}
							style={{
								backgroundColor: '#FFFFFF',
								borderRadius: 8,
								marginBottom: 16,
								marginLeft: 13,
								marginRight: 13,
								padding: 16,
							}}
							onClick={() => handleQueueClick(queue)}
						>
							<Title level="3" weight="semibold">
								{queue.title}
							</Title>
							<Text style={{ fontSize: '15px', color: 'var(--text_secondary)' }} weight="regular">
								Осталось времени: {timeRemaining.days}д {timeRemaining.hours}ч {timeRemaining.minutes}м {timeRemaining.seconds}с
							</Text>


						</Cell>
					);
				})}
			</Group>
		);
	};


	const renderUpcomingQueues = () => {
		const upcomingQueues = queues.filter(
			(queue) => new Date() < new Date(queue.startDate)
		);

		if (upcomingQueues.length === 0) return null;

		return (
			<Group header={<Title level="3" weight="semibold">Грядущие очереди</Title>}>
				{upcomingQueues.map((queue, index) => {
					const timeRemaining = getTimeRemaining(queue.startDate);
					return (
						<Cell
							key={index}
							before={<Avatar src={queue.avatar} />}
							style={{
								backgroundColor: '#FFFFFF',
								borderRadius: 8,
								marginBottom: 16,
								marginLeft: 13,
								marginRight: 13,
								padding: 16,
							}}
							onClick={() => handleQueueClick(queue)}
						>
							<Title level="3" weight="semibold">
								{queue.title}
							</Title>
							<Text style={{ fontSize: '15px', color: 'var(--text_secondary)' }} weight="regular">
								До начала: {timeRemaining.days}д {timeRemaining.hours}ч {timeRemaining.minutes}м {timeRemaining.seconds}с
							</Text>

						</Cell>
					);
				})}
			</Group>
		);
	};

	useEffect(() => {
		bridge.send('VKWebAppGetUserInfo')
			.then(data => setCurrentUserAvatar(data.photo_100)) // Сохраните аватарку текущего пользователя
			.catch(error => console.log(error)); // Обработка ошибок
	}, []);

	useEffect(() => {
		// Вызывайте функции для отрисовки очередей при обновлении timeUpdate
		renderActiveQueues();
		renderUpcomingQueues();
	}, [queues, timeUpdate]);

	useEffect(() => {
		bridge.send('VKWebAppGetUserInfo')
			.then(data => setCurrentUserId(data.id))
			.catch(error => console.log(error)); // Обработка ошибок
	}, []);

	useEffect(() => {
		if (currentUserId !== null) {
			refreshQueues();
		}
	}, [currentUserId]);

	const refreshQueues = () => {
		api.get(`/api/users/${currentUserId}/queues/`)
			.then((response) => {
				const newQueues = response.data.map((queue) => {
					const newQueue = {
						id: queue.id,
						title: queue.name,
						startDate: queue.start_date,
						endDate: queue.end_date,
						limit: queue.limit,
						currentPosition: queue.current_position,
						creatorId: queue.creator_id,
						users: queue.users,
						avatar: null,
					};

					return bridge
						.send('VKWebAppGetUserInfo', { user_id: queue.creator_id })
						.then((data) => {
							newQueue.avatar = data.photo_100;
						})
						.then(() => {
							return Promise.all(
								newQueue.users.map((user) => {
									return bridge
										.send('VKWebAppGetUserInfo', { user_id: user.user.id })
										.then((response) => {
											user.avatar = response.photo_200;
											user.lastName = response.last_name;
											user.firstName = response.first_name;
										});
								})
							);
						})
						.then(() => newQueue);
				});

				Promise.all(newQueues).then((updatedQueues) => {
					setQueues(updatedQueues);
				});
			})
			.catch((error) => {
				console.log(error);
			});
	};




	const modal = (
		<ModalRoot
			activeModal={modalVisible ? 'createQueue' : null}
			onClose={closeModal}
		>
			<QueueModal id="createQueue" onClose={closeModal} addQueue={addQueue} />
		</ModalRoot>
	);


	const isUserCreator = (queue) => {
		return queue.creatorId === currentUserId;
	};


	return (
		<div style={{ background: '#EBEDF0', height: '100vh' }}>
			{activePanel === "main" ? (
				<Panel id="panel1">
					<PanelHeader before={<PanelHeaderClose />} after={<Avatar size={30} />}>
						Вочередь!
					</PanelHeader>
					<div
						style={{
							height: 'calc(100vh - 128px)',
							display: 'flex',
							flexDirection: 'column',
							alignItems: 'stretch',
						}}
					>
						{queues.length === 0 && (
							<Placeholder
								icon={<Icon28UserAddOutline width={56} height={56} />}
								header="Очереди не найдены"
							>
								У вас пока нет ни одной очереди. Создайте первую.
							</Placeholder>
						)}
						{renderActiveQueues()}
						{renderUpcomingQueues()}
					</div>
					<div style={{ zIndex: 10 }}>
						{modal}
					</div>
					<FixedLayout vertical="bottom">
						<div
							style={{
								background: '#FFFFFF',
								height: 72,
								borderTopLeftRadius: 12,
								borderTopRightRadius: 12,
							}}
						>
							<Button
								mode="commerce"
								size="xl"
								style={{
									marginLeft: 16,
									marginRight: 16,
									marginTop: 12,
									marginBottom: 12,
									background: '#2688EB',
									borderRadius: 12,
									color: '#FFFFFF',
									padding: '12px 16px',
									width: 'calc(100% - 32px)',
									boxShadow: 'none',
									transition: 'box-shadow 0.15s ease-in-out',
								}}
								before={<Icon24Add fill="#ffffff" />}
								onClick={openModal}
								hoverMode="opacity"
								activeMode="opacity"
								className="queue-create-button"
							>
								Создать очередь
							</Button>
						</div>
					</FixedLayout>
				</Panel>
			) : (
				<>
					<QueueMenu
						id="queueMenu"
						goBack={goBack}
						queue={currentQueue}
						isUserCreator={() => isUserCreator(currentQueue)}
						props={{
							queueTitle: currentQueue.title,
							queueTimeInfo:
								new Date() < new Date(currentQueue.startDate)
									? `До начала: ${getTimeRemaining(currentQueue.startDate).days}д ${getTimeRemaining(currentQueue.startDate).hours}ч ${getTimeRemaining(currentQueue.startDate).minutes}м ${getTimeRemaining(currentQueue.startDate).seconds}с`
									: `Осталось времени: ${getTimeRemaining(currentQueue.endDate).days}д ${getTimeRemaining(currentQueue.endDate).hours}ч ${getTimeRemaining(currentQueue.endDate).minutes}м ${getTimeRemaining(currentQueue.endDate).seconds}с`
						}}
					/>


				</>
			)}
		</div>
	);
}

export default App;

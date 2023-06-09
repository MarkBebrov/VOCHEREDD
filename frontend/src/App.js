import { React, useState, useEffect, useCallback } from 'react';
import '@vkontakte/vkui/dist/vkui.css';
import {
	Panel,
	PanelHeader,
	Placeholder,
	Button,
	ModalRoot,
	FixedLayout,
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
import { Icon24RefreshOutline } from '@vkontakte/icons';

function App() {

	const [isQueueEnded, setIsQueueEnded] = useState(false);


	const [prevPanel, setPrevPanel] = useState(null);

	const [activePanel, setActivePanel] = useState("main");
	const [currentUserId, setCurrentUserId] = useState(null);
	const goToQueueMenu = () => {
		setPrevPanel(activePanel);
		setActivePanel("queueMenu");
	};

	const goBack = () => {
		refreshQueues();
		setActivePanel(prevPanel);
	};


	const [modalVisible, setModalVisible] = useState(false);
	const [queues, setQueues] = useState([]);

	const [currentQueue, setCurrentQueue] = useState(null);

	useEffect(() => {
		if (currentQueue && new Date() >= new Date(currentQueue.endDate)) {
			setIsQueueEnded(true);
		} else {
			setIsQueueEnded(false);
		}
	}, [currentQueue]);


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
			name: newQueue.name,
			limit: newQueue.limit,
			start_date: newQueue.startDate.toISOString(),
			end_date: newQueue.endDate.toISOString(),
			creator_id: currentUserId,
		};
		console.log(newQueueData);
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
					const isQueueEnded = new Date() >= new Date(queue.endDate); // Добавьте эту строку

					return (
						<Cell
							key={index}
							before={<Avatar src={queue.avatar} />}
							style={{
								backgroundColor: '#FFFFFF',
								borderRadius: 0,
								marginBottom: 0,
								marginLeft: 0,
								marginRight: 13,
								padding: 0,
							}}
							onClick={() => handleQueueClick(queue)}
						>
							<Title level="3" weight="semibold">
								{queue.name}
							</Title>
							<Text
								style={{
									fontSize: '15px',
									color: isQueueEnded ? 'green' : 'var(--text_secondary)',
								}}
								weight="regular"
							>
								{isQueueEnded
									? 'Запись окончена'
									: `Осталось времени: ${timeRemaining.days}д ${timeRemaining.hours}ч ${timeRemaining.minutes}м ${timeRemaining.seconds}с`}
								{", участников: " + queue.users.length + ", вступило: " + queue.users.filter(user => user.position !== null).length + (queue.limit !== null ? ("/" + queue.limit) : "")}
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
								borderRadius: 0,
								marginBottom: 0,
								marginLeft: 0,
								marginRight: 13,
								padding: 0,
							}}
							onClick={() => handleQueueClick(queue)}
						>
							<Title level="3" weight="semibold">
								{queue.name}
							</Title>
							<Text style={{ fontSize: '15px', color: 'var(--text_secondary)' }} weight="regular">
								До начала: {timeRemaining.days}д {timeRemaining.hours}ч {timeRemaining.minutes}м {timeRemaining.seconds}с
								{", участников: " + queue.users.length + ", вступило: " + queue.users.filter(user => user.position !== null).length + (queue.limit !== null ? ("/" + queue.limit) : "")}
							</Text>

						</Cell>
					);
				})}
			</Group>
		);
	};

	useEffect(() => {
		// Вызывайте функции для отрисовки очередей при обновлении timeUpdate
		renderActiveQueues();
		renderUpcomingQueues();
	}, [queues, timeUpdate]);


	let tempUserId;
	const getUserInfo = () => {
		return bridge
			.send('VKWebAppGetUserInfo')
			.then((data) => {
				setCurrentUserId(data.id);
				tempUserId = data.id;
			})
			.catch((error) => {
				console.log(error);
			});
	}

	useEffect(() => {
		const currentHash = window.location.hash; // Получение текущего значения хэша
		const firstPart = currentHash.substr(0, 1); // Получение первого символа хэша
		const secondPart = currentHash.substr(1); // Получение оставшейся части хэша
		const newHash = firstPart + "&" + secondPart;
		const linkParams = new URLSearchParams(newHash);

		getUserInfo().then((userId) => {
			if (linkParams.has("queue_id")) {
				const queue_id = linkParams.get("queue_id");
				//api.delete(`/api/queues/3/users/`, { params: { user_id: 252527383 } });
				api.post(`/api/queues/${queue_id}/users/`, { "user_id": tempUserId }).then(() => {
					refreshQueuesBy(tempUserId)/*.then((updatedQueues)=>{
						const queue = updatedQueues.find((queue) => queue.id === queue_id);
						console.log("queue " + JSON.stringify(updatedQueues, null, 2));
						goToQueueMenu(queue);
					});*/
				}).catch((error) => {
					refreshQueuesBy(tempUserId);
				});
			}
			
			else {
				refreshQueuesBy(tempUserId);
			}
		})

	}, []);

	const refreshQueues = () => {
		refreshQueuesBy(currentUserId);
	}

	const refreshQueuesBy = (userId) => {
		return api.get(`/api/users/${userId}/queues/`)
			.then((response) => {

				const newQueues = response.data.map((queue) => {
					const newQueue = {
						id: queue.id,
						name: queue.name,
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

				return Promise.all(newQueues).then((updatedQueues) => {
					setQueues(updatedQueues);
					return updatedQueues;
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
					<PanelHeader after={<Avatar size={30} />}>
						Вочередь!
					</PanelHeader>
					<div
						style={{
							height: 'calc(100vh - 128px)',
							display: 'flex',
							flexDirection: 'column',
							alignItems: 'stretch',
							overflow: 'auto',
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
								display: 'flex',
								alignItems: 'center',
								padding: '12px 16px',
							}}
						>
							<Button
								mode="commerce"
								size="xl"
								style={{
									background: '#2688EB',
									borderRadius: '12px',
									color: '#FFFFFF',
									padding: '12px 16px',
									boxShadow: 'none',
									transition: 'box-shadow 0.15s ease-in-out',
									flexGrow: 1, // Растягиваем кнопку на всю доступную ширину
								}}
								before={<Icon24Add fill="#ffffff" />}
								onClick={openModal}
								hoverMode="opacity"
								activeMode="opacity"
								className="queue-create-button"
							>
								Создать очередь
							</Button>
							<Button
								mode="tertiary"
								size="m"
								before={<Icon24RefreshOutline />}
								onClick={refreshQueues}
								style={{
									color: '#FFFFFF',
									width: 52,
									height: 52,
									borderRadius: 12,
									marginLeft: 10,
									background: '#2688EB',
								}}
								hoverMode="opacity"
								activeMode="opacity"
							/>
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
						refreshQueues={refreshQueues}
						currentUserId={currentUserId}
						props={{
							queueTitle: currentQueue.name,
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

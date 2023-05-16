import React, { useState, useEffect } from 'react';

import {
    ModalPage,
    ModalPageHeader,
    PanelHeaderClose,
    FormItem,
    Subhead,
    Tabs,
    TabsItem,
    Separator,
    Input,
    Button,
    Group,
    PanelHeaderContent,
    Checkbox,
    LocaleProvider,
    DateInput,
    Slider,
    Select,
    SegmentedControl,
} from '@vkontakte/vkui';
import { Icon28CancelOutline, Icon24ChevronDown } from '@vkontakte/icons';



const QueueModal = ({ id, onClose, addQueue }) => {
    const [activeTab, setActiveTab] = useState('обычные');
    const [checkbox1, setCheckbox1] = useState(false);
    const [checkbox2, setCheckbox2] = useState(false);
    const [checkbox3, setCheckbox3] = useState(false);

    const [queueName, setQueueName] = useState('');
    const [nameStatus, setNameStatus] = useState('valid');
    const [nameError, setNameError] = useState('');

    const [startDate, setStartDate] = useState(undefined);
    const [endDate, setEndDate] = useState(undefined);
    const [dateError, setDateError] = useState('');

    const [value, setValue] = useState(undefined);
    const [enableTime, setEnableTime] = useState(true);
    const [disablePast, setDisablePast] = useState(true);
    const [disableFuture, setDisableFuture] = useState(false);
    const [disablePickers, setDisablePickers] = useState(false);
    const [closeOnChange, setCloseOnChange] = useState(true);
    const [showNeighboringMonth, setShowNeighboringMonth] = useState(false);
    const [disableCalendar, setDisableCalendar] = useState(false);
    const [locale, setLocale] = useState('ru');
    const [value2, setValue2] = useState(undefined);

    const [submitClicked, setSubmitClicked] = useState(false);

    useEffect(() => {
        if (submitClicked) {
            if (!queueName) {
                setNameStatus('error');
                setNameError('Это поле обязательно для заполнения');
            } else if (queueName.length > 40) {
                setNameStatus('error');
                setNameError('Название не может быть длиннее 40 символов');
            } else {
                setNameStatus('valid');
                setNameError('');
            }
        }
    }, [queueName, submitClicked]);

    useEffect(() => {
        if (startDate && endDate && endDate < startDate) {
            setDateError('Вы выбрали невозможную дату');
        } else {
            setDateError('');
        }
    }, [startDate, endDate]);

    const handleSubmit = () => {
        setSubmitClicked(true);
        if (nameStatus === 'valid' && !dateError) {
            // Создание новой очереди
            const newQueue = {
                id: Date.now(),
                title: queueName,
                startDate,
                endDate,
                activeTab,
                checkbox1,
                checkbox2,
            };
            addQueue(newQueue); // Используйте функцию addQueue здесь
            onClose();
        }
    };
    return (
        <ModalPage
            id={id}
            header={
                <ModalPageHeader
                    left={<PanelHeaderClose onClick={onClose} aria-label="Закрыть" />}
                >
                    <PanelHeaderContent>Создание очереди</PanelHeaderContent>
                </ModalPageHeader>
            }
            style={{ width: '100%', alignItems: 'center' }}
        >
            <FormItem top="Настройки очереди">
                <SegmentedControl
                    value={activeTab}
                    onChange={(value) => setActiveTab(value)}
                    options={[
                        {
                            label: 'Обычные',
                            value: 'обычные',
                        },
                        {
                            label: 'Дополнительные',
                            value: 'дополнительные',
                        },
                    ]}
                />
            </FormItem>


            <Separator style={{ margin: '12px 0' }} />

            {activeTab === 'обычные' && (
                <>
                    <FormItem
                        top="Название"
                        status={nameStatus}
                        bottom={nameError}
                    >
                        <Input
                            placeholder="Введите название"
                            value={queueName}
                            onChange={(e) => setQueueName(e.target.value)}
                        />
                    </FormItem>

                    <FormItem top="Дополнительные настройки">
                        <Checkbox checked={checkbox1} onChange={() => setCheckbox1(!checkbox1)}>
                            Ограничить количество человек
                        </Checkbox>
                    </FormItem>

                    {checkbox1 && (
                        <>
                            <FormItem top="Количество человек">
                                <Slider step={1} min={0} max={50} value={Number(value2)} onChange={setValue2} />
                            </FormItem>
                            <FormItem>
                                <Input
                                    min={0}
                                    value={String(value2)}
                                    onChange={(e) => setValue2(e.target.value)}
                                    type="number"
                                />
                            </FormItem>
                        </>
                    )}
                    <FormItem
                        top="Начало записи в очередь"
                    >
                        <div style={{ display: 'flex', position: 'relative', zIndex: 1 }}>
                            <LocaleProvider value={locale}>
                                <DateInput
                                    value={startDate}
                                    onChange={setStartDate}
                                    enableTime={enableTime}
                                    disablePast={disablePast}
                                    disableFuture={disableFuture}
                                    closeOnChange={closeOnChange}
                                    disablePickers={disablePickers}
                                    showNeighboringMonth={showNeighboringMonth}
                                    disableCalendar={disableCalendar}
                                />
                            </LocaleProvider>
                        </div>
                    </FormItem>
                    <FormItem
                        top="Конец записи в очередь"
                        bottom={<span style={{ color: 'red', position: 'relative', zIndex: 1 }}>{dateError}</span>}
                    >
                        <div style={{ display: 'flex', position: 'relative', zIndex: 1 }}>
                            <LocaleProvider value={locale}>
                                <DateInput
                                    value={endDate}
                                    onChange={setEndDate}
                                    enableTime={enableTime}
                                    disablePast={disablePast}
                                    disableFuture={disableFuture}
                                    closeOnChange={closeOnChange}
                                    disablePickers={disablePickers}
                                    showNeighboringMonth={showNeighboringMonth}
                                    disableCalendar={disableCalendar}
                                />
                            </LocaleProvider>
                        </div>
                    </FormItem>
                </>
            )}

            {activeTab === 'дополнительные' && (
                <>
                    <FormItem top="Дополнительные настройки">
                        <Checkbox checked={checkbox1} onChange={() => setCheckbox1(!checkbox1)}>
                            Автоматически перемешать очередь
                        </Checkbox>
                        <Checkbox checked={checkbox2} onChange={() => setCheckbox2(!checkbox2)}>
                            Режим выбора места в очереди
                        </Checkbox>
                        <Checkbox checked={checkbox3} onChange={() => setCheckbox3(!checkbox3)}>
                            Режим заявок на очередь
                        </Checkbox>
                    </FormItem>

                    <FormItem top="Время на человека">
                        <Input placeholder="Введите время" />
                    </FormItem>
                </>
            )}

            <Group>
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
                    hoverMode="opacity"
                    activeMode="opacity"
                    onClick={handleSubmit}
                >
                    Создать очередь
                </Button>
            </Group>
        </ModalPage>
    );
};

export default QueueModal;